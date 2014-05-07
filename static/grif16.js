function cycleTo(ADC){

	var i,
		data = 'Chan,Counts\n';

	for(i=0; i<100; i++){
		data += i + ',' + (Math.random()*50+975) + '\n';
	}
	
	window.dygraph = new Dygraph(document.getElementById('plotTarget'), data, {
		title: 'ADC_' + ADC,
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