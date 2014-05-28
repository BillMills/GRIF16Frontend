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
    xmlhttp.open('GET', window.mscbHost + '/mscb?node='+(window.currentADC+2));
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

	//special label for the DC offset slider
	document.getElementById('dcofstLabel').innerHTML = (document.getElementById('a_dcofst').value - 2048)*0.6714 + ' mV';

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
		
		for(i=0; i<dv.byteLength/2; i+=2){
			CSV += i*5 + ',' + dv.getInt16(i, true)*0.1220703125 + '\n';
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

	xmlhttp.open("GET", window.mscbHost + "/fifo_raw?ch="+window.currentADC, true);
	xmlhttp.responseType = "arraybuffer";
	xmlhttp.send(null);
}

function updateADC(){
	var url = window.mscbHost + '/mscb_rx'
	,	addr = 2 + window.currentADC
	,	var_id, var_name, width, data, flag, unit, value;

	//number inputs have the variable name as their id, radios as their name:
	if(window.ADCparameters[window.currentADC][this.id])
		var_name = this.id;
	else
		var_name = this.name;

	var_id = window.ADCparameters[window.currentADC][var_name]['id'];
	width = window.ADCparameters[window.currentADC][var_name]['w'];
	flag = window.ADCparameters[window.currentADC][var_name]['f'];
	unit = window.ADCparameters[window.currentADC][var_name]['u'];
	data = new DataView(new ArrayBuffer(width));
	value = this.value;
	if(var_name == 'a_dcofst'){
		document.getElementById('dcofstLabel').innerHTML = ((this.value - 2048)*0.6714).toFixed(4) + ' mV';
	}

	if(unit == MSCB_DEFINES['UNIT_BOOLEAN']){
		data.setInt8(0, (value == 'true')? 1 : 0);
	} else {

		if(flag & MSCB_DEFINES['MSCBF_FLOAT'])
			data.setFloat32(0, parseFloat(this.value) );
		else if(flag & MSCB_DEFINES['MSCBF_SIGNED']){
			if(width==1){
				data.setInt8(0, parseInt(value,10) );
			} else if(width==2){
				data.setInt16(0, parseInt(value,10) );
			} else if(width==4){
				data.setInt32(0, parseInt(value,10) );
			} else{
				//NOPE
			}
		} else {
			if(width==1){
				data.setUint8(0, parseInt(value,10) );
			} else if(width==2){
				data.setUint16(0, parseInt(value,10) );
			} else if(width==4){
				data.setUint32(0, parseInt(value,10) );
			} else{
				//NOPE
			}		
		}
	}
    	
	//console.log('trying MSCB_WriteVar('+url+', '+addr+', '+var_id+', '+data+')' )
	MSCB_WriteVar( url, addr, var_id, data )
}

function populateStatusPane(){
	var xmlhttp = new XMLHttpRequest();

    xmlhttp.onreadystatechange = function(){
    	var key, data, i = 0, time
    		content,
    		titles = [
    			'Control Bits: ',
    			'Revision: ',
    			'Serial: ',
    			'FPGA Temperature: ',
    			'Clock Cleaner Locked: ',
    			'Clock Cleaner Frequency: ',
    			'Hardware / Software Match: ',
    			'Hardware ID: ',
    			'Hardware Timestamp: ',
    			'Software ID: ',
    			'Software Timestamp: ',
    			'Uptime: ',
    			'dac_ch: ',
    			'Reference Clock: ',
    			'Enabled Channels: ',
    			'Enabled ADCs: '
    		]

    	if(this.readyState != 4) return;

    	data = JSON.parse(this.responseText);

    	for(key in data){
    		content = titles[i] + data[key].d;
    		if(i==3)
    			content += ' C'
    		if(i==7 || i==9)
    			content = titles[i] + '0x' + parseInt(data[key].d, 10).toString(16);
    		if(i==8 || i==10){
    			time = new Date(parseInt(data[key].d, 10)*1000);
    			content = titles[i] + time.toString();
    		}
    		if(i==11){
    			time = parseInt(data[key].d, 10);
    			content = titles[i] + chewUptime(time);
    		}


    		document.getElementById(key).innerHTML = content;
    		i++;
    	}

    	setTimeout(populateStatusPane, 10000)

	};

	xmlhttp.open("GET", window.mscbHost + "/mscb?node=1", true);
	xmlhttp.responseType = "application/json";
	xmlhttp.send(null);	
}

function chewUptime(s){
	var time = s,
		elapsed = '';

	if(time > 24*3600){
		elapsed += Math.floor(time/(24*3600)) + ' d'
		time = time % (24*3600);
	}
	if(time > 3600){
		if(elapsed != '') elapsed += ', '
		elapsed += Math.floor(time/(3600)) + ' h'
		time = time % (3600);
	}
	if(time > 60){
		if(elapsed != '') elapsed += ', '
		elapsed += Math.floor(time/(60)) + ' min'
		time = time % (60);
	}
	if(time > 0){
		if(elapsed != '') elapsed += ', '
		elapsed += Math.floor(time) + ' s'
	}

	return elapsed;

}
