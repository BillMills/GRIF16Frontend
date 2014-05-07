function cycleTo(ADC){

	fetchADC(ADC);	

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

function fetchADC(n){
    var xmlhttp = new XMLHttpRequest();

    xmlhttp.onreadystatechange = function(){
        var response = JSON.parse(this.responseText),
        	data = response.d,
        	CSV = 'Chan,Counts\n',
        	i;

        //build CSV
        for(i=0; i<data.length; i++){
        	CSV += i + ',' + data[i] + '\n';
        }

        //draw dygraph
		window.dygraph = new Dygraph(document.getElementById('plotTarget'), CSV, {
			title: 'ADC_' + n,
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
            
    }
    //fire async
    xmlhttp.open('GET', 'http://mscb500.triumf.ca/fifo?ch='+n);
    xmlhttp.send();
}