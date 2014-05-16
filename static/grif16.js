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
		//valueRange: [-1000, 1000],
		//legend: 'always',
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
//TBD: booleans are being posted as floats, not going to touch them until we discuss why...
function updateParameters(n){

	var numberID = [	'a_off', 
						't_hthres', 't_thres', 't_diff', 't_int', 't_delay', 't_polcor', 't_blrctl', 
						'p_int', 'p_diff', 'p_delay', 'p_polec1', 'p_polec2', 'p_bsr', 'p_gain', 'p_pactrl',
						'cfd_dly', 'cfd_frac',
						'wfr_pret', 'wfr_smpl', 'wfr_dec',
						'sim_phgt', 'sim_rise', 'sim_fall', 'sim_rate',
						'fix_dead', 'det_type'
		],
		i;

	//all number inputs have id == data key name
	for(i=0; i<numberID.length; i++)
		document.getElementById(numberID[i]).value = window.ADCparameters[n][numberID[i]]['d'];

}

//handle global keypress events
function keypress(event){
	var inc, viewRequested;

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
				"file": CSV
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
