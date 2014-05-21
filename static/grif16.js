function cycleTo(ADC){
	var CSV = 'ns,mV,\n'

	window.currentADC = ADC;
	fetchParameters();

    //properly remove old dygraph or else memory leaks :/
	if(window.dygraph)
		window.dygraph.destroy();

    //draw dygraph
	window.dygraph = new Dygraph(document.getElementById('plotTarget'), CSV, {
		title: 'ADC_' + window.currentADC,
		xlabel: 'ns',
		ylabel: 'mV',
		sigFigs: 2,
		strokeWidth: 4,
		yAxisLabelWidth: 75,
		xAxisHeight: 30,
		highlightCircleSize: 6,
		titleHeight: 50,
		showLabelsOnHighlight: false,
		stepPlot: true,
		includeZero: true,
		colors: ['#F1C40F', '#2ECC71', '#E74C3C', '#ECF0F1', '#1ABC9C', '#E67E22', '#9B59B6']
	});

};

function toggleSection(id){
	var section = document.getElementById(id)

	if(section.className == 'collapse'){
		section.className = 'expand'
		this.innerHTML = String.fromCharCode(0x25BC) + this.innerHTML.slice(this.innerHTML.indexOf(' '));
	}
	else{
		section.className = 'collapse'
		this.innerHTML = String.fromCharCode(0x25B6) + this.innerHTML.slice(this.innerHTML.indexOf(' '));	
	}
}

//gets the parameters set for all ADCs
function fetchParameters(){
    var xmlhttp = new XMLHttpRequest();

    xmlhttp.onreadystatechange = function(){
    	if(this.readyState != 4) return;

        window.ADCparameters[window.currentADC] = JSON.parse(this.responseText);
        updateParameters(window.currentADC)

    }
    //fire async
    xmlhttp.overrideMimeType('application/json');
    xmlhttp.open('GET', 'http://mscb500.triumf.ca/mscb?node='+(window.currentADC+2));
    xmlhttp.send();
}

//insert the parameters from channel n into the control sidebar
function updateParameters(n){

	var numberID = [	'a_dcofst', 'a_trim',
						't_hthres', 't_thres', 't_diff', 't_int', 't_delay', 't_polcor', 't_blrctl', 
						'p_int', 'p_diff', 'p_delay', 'p_polec1', 'p_polec2', 'p_bsr', 'p_gain', 'p_pactrl',
						'cfd_dly', 'cfd_frac',
						'wfr_pret', 'wfr_smpl', 'wfr_dec',
						'sim_phgt', 'sim_rise', 'sim_fall', 'sim_rate',
						'fix_dead', 'det_type'
		],
		radioName = [	'a_off',
						'a_pol',
						'a_fgain',
						't_off',
						'wfr_supp',
						'wfr_off',
						'sim_ena',
						'sim_rand'
		],
		i;

	//all number inputs have id == data key name
	for(i=0; i<numberID.length; i++)
		document.getElementById(numberID[i]).value = window.ADCparameters[n][numberID[i]]['d'];

	//all radio inputs have name == data key name
	for(i=0; i<radioName.length; i++){
		document.querySelectorAll('input[name = "'+radioName[i]+'"][value = '+window.ADCparameters[n][radioName[i]]['d']+']')[0].checked = true;	
	}

}

//handle global keypress events
function keypress(event){
	var inc, viewRequested;

	//bail out if we're trying to move the cursor around an input
    if(event.target.tagName == 'INPUT') return;

	if(event.keyCode == 37)
		inc = -1;
	else if(event.keyCode == 39)
		inc = 1;
	else 
		return;

	viewRequested = (window.currentADC + inc) % 16;
	if(viewRequested == -1)
		viewRequested = 15;

	document.getElementById('swap'+viewRequested).onclick();
	document.getElementById('swap'+viewRequested).checked = true;
}

function fetchADC(){
	var xmlhttp = new XMLHttpRequest();

    xmlhttp.onreadystatechange = function(){
    	var i, dv,
    		CSV = 'ns,mV\n', 
    		unpackedData = [];

    	if(this.readyState != 4) return;

		dv = new DataView(this.response);
		
		for(i=0; i<dv.byteLength/2; i++){
			CSV += i*10 + ',' + dv.getInt16(2*i)*0.1220703125 + '\n';
		}
        
		if(window.dygraph){
			window.dygraph.updateOptions({
				"file": CSV,
				"valueRange": [parseInt(document.getElementById('yMin').value, 10), parseInt(document.getElementById('yMax').value, 10)]
			});
		}

        //refetch
        //window.fetch = setTimeout(fetchADC.bind(null), 500);
        fetchADC()

	};

	xmlhttp.open("GET", "http://mscb500.triumf.ca/fifo_raw?ch="+(2+window.currentADC), true);
	xmlhttp.responseType = "arraybuffer";
	xmlhttp.send(null);
}

function updateADC(){
	var url = 'http://mscb500.triumf.ca/mscb_rx'
	,	addr = 2 + window.currentADC
	,	var_id, var_name, width, data;

	//number inputs have the variable name as their id, radios as their name:
	if(window.ADCparameters[window.currentADC][this.id])
		var_name = this.id;
	else
		var_name = this.name;

	var_id = window.ADCparameters[window.currentADC][var_name]['id'];
	width = window.ADCparameters[window.currentADC][var_name]['w'];
	data = new DataView(new ArrayBuffer(width));

    if(window.typeLookup[var_name] == 'int'){
    	if(width == 1)
    		data.setInt8(0, parseInt(this.value,10) );
    	if(width == 2)
	    	data.setInt16(0, parseInt(this.value,10) );
    } else if(window.typeLookup[var_name] == 'float')
    	data.setFloat32(0, parseFloat(this.value) );
    else if(window.typeLookup[var_name] == 'bool')
    	data.setInt8(0, (this.value == 'true')? 1 : 0);

	//console.log('trying MSCB_WriteVar('+url+', '+addr+', '+var_id+', '+data+')' )
	MSCB_WriteVar( url, addr, var_id, data )
}
