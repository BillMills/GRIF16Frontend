function cycleTo(ADC){

	window.currentADC = ADC;
	if(!window.ADCparameters)
		fetchParameters();
	else
		updateParameters(window.currentADC)

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

function fetchADC(){
    var xmlhttp = new XMLHttpRequest();

    xmlhttp.onreadystatechange = function(){
    	if(this.readyState != 4) return;

        var response = JSON.parse(this.responseText),
        	data = response.d,
        	CSV = 'Chan,Counts\n',
        	i;

        //build CSV
        for(i=0; i<data.length; i++){
        	CSV += i + ',' + data[i] + '\n';
        }

        //properly remove old dygraph or else memory leaks :/
		if(window.dygraph)
			window.dygraph.destroy();

        //draw dygraph
		window.dygraph = new Dygraph(document.getElementById('plotTarget'), CSV, {
			title: 'ADC_' + window.currentADC,
			xlabel: 'ADC Channel',
			ylabel: 'Counts',
			sigFigs: 2,
			strokeWidth: 4,
			yAxisLabelWidth: 75,
			xAxisHeight: 30,
			highlightCircleSize: 6,
			titleHeight: 50,
			//legend: 'always',
			stepPlot: true,
			includeZero: true,
			colors: ['#F1C40F', '#2ECC71', '#E74C3C', '#ECF0F1', '#1ABC9C', '#E67E22', '#9B59B6']
		});
        
        //refetch
        window.fetch = setTimeout(fetchADC.bind(null), 500);
        //fetchADC(n)

    }
    //fire async
    xmlhttp.open('GET', 'http://mscb500.triumf.ca/fifo?ch='+window.currentADC);
    xmlhttp.send();
}

//gets the parameters set for all ADCs
function fetchParameters(){
    var xmlhttp = new XMLHttpRequest();

    xmlhttp.onreadystatechange = function(){
    	if(this.readyState != 4) return;

        window.ADCparameters = JSON.parse(this.responseText);
        updateParameters(window.currentADC)

    }
    //fire async
    xmlhttp.open('GET', 'http://mscb500.triumf.ca/mscb?node=2');
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
		document.getElementById(numberID[i]).value = window.ADCparameters['vars'][n][numberID[i]]['d'];

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