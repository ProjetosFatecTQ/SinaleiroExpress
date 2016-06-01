window.onload = function(){
	var ambiente = new Ambiente();	
};

/* Representa o ambiente e suas características onde as vias estão. */
function Ambiente(){
	this.chuva = true;
	this.horario = new Date();
	
	this.picos = [];
	this.inserePico(
			new Date(2016, 01, 01, 7, 0, 0), 
			new Date(2016, 01, 01, 9, 0, 0)
	);

	this.inserePico(
			new Date(2016, 01, 01, 17, 30, 0), 
			new Date(2016, 01, 01, 20, 30, 0)
	);

	this.semaforos = [];
	this.insereSemaforo("RUA", 20, 2, 25, false, false);
	this.insereSemaforo("AVE", 30, 3, 40, true, true);

	setInterval(this.atualiza.bind(this), 500);	
}
/* As ações do ambiente. */
Ambiente.prototype = {
	atualiza: function(){
		this.horario = new Date();

		for(var i = 0; i < this.semaforos.length; i++){
			if(this.semaforos[i].atualizaTempo()){

			}else{
				// ABRIR OUTRO
				this.abrirOutro(this.semaforos[i]);
				return;
			}
		}
		
	},
	abrirOutro: function(semaforo){
		for(var i = 0; i < this.semaforos.length; i++){
			if(this.semaforos[i].nome != semaforo.nome){
				this.abrirSemaforo(this.semaforos[i]);
				return;
			}
		}
	},
	estaEmHorarioDePico: function(){
		for(var i = 0; i < this.picos.length; i++){
			if(this.picos[i].estaEmPico(this.horario)){
				return true;
			}
		}

		return false;
	},
	inserePico: function(inicio, fim){
		this.picos.push(
			new HorarioPico(inicio, fim)
		);
	},
	abrirSemaforo: function(s){
		s.setVerde();		
		s.abrir(this.chuva, this.estaEmHorarioDePico());

	},
	insereSemaforo: function(nome, tempoPadrao, status,
			 limiteTrafego, recebeHorario, recebeChuva){
		var s = new Semaforo(nome, tempoPadrao, limiteTrafego,
				recebeHorario, recebeChuva);
		if(status == 1){
			s.setAmarelo();
		}else if(status == 2){
			this.abrirSemaforo(s);
		} else{
			s.setVermelho();
		}

		this.semaforos.push(s);
	}	
};


/* Representa um semaforo. */
function Semaforo(nome, tempoPadrao, limiteTrafego, recebeHorario, recebeChuva){
	this.nome = nome;
	this.status = null;
	this.tempoAmarelo = 4;
	this.tempoPadrao = tempoPadrao;
	this.tempoParaFechar = null;
	
	this.trafegoAtual = 0;
	this.limiteTrafego = limiteTrafego;

	this.recebeHorario = recebeHorario;
	this.recebeChuva = recebeChuva;

	this.estaChovendo = null;
	this.estaHorarioPico = null;

	this.limiteAcrescimo = 10;
}
/* Representa as ações de um semaforo. */
Semaforo.prototype = {
	estaComTrafegoAlto: function(){
		return this.trafegoAtual > this.limiteTrafego;
	},
	estaAmarelo: function(){
		return this.status == 1;
	},
	estaVerde: function(){
		return this.status == 2;
	},
	estaVermelho: function(){
		return this.status == 3;
	},
	setAmarelo: function(){
		this.status = 1;
	},
	setVerde: function(){
		this.status = 2;
	},
	setVermelho: function(){
		this.status = 3;
	},
	getTempoVerde: function(){
		var tempo = this.tempoPadrao - this.tempoAmarelo;

		var acrescimo = 0;
		if(this.estaComTrafegoAlto()){
			this.write("TRAFEGO : +5s pois tem " + this.trafegoAtual + " carros na via de " + this.limiteTrafego + " carros de limite.");
			acrescimo += 5;
		}else{
			this.write("TRAFEGO : sem acrescimo. " + this.trafegoAtual + " carros na via de " + this.limiteTrafego + " carros de limite.");
		}

		if(this.estaChovendo && this.recebeChuva){
			this.write("CHUVA: +5s");
			acrescimo += 5;
		}

		if(this.estaHorarioPico && this.recebeHorario){
			this.write("HORARIO PICO: +5s");
			acrescimo += 5;
		}

		if(acrescimo > this.limiteAcrescimo)
			acrescimo = this.limiteAcrescimo;

		var total = tempo + acrescimo;			

		this.write("TEMPO: " + tempo + "s ACRESCIMO: " + acrescimo + "s TOTAL: " + total + "s");

		return total;
	},
	abrir: function(chuva, horarioPico){
		this.estaChovendo = chuva;
		this.estaHorarioPico = horarioPico;

		if(!this.estaVerde()){
			this.write("NAO PODE SER ABERTO.");
			return;
		}

		this.tempoParaFechar = this.getTempoVerde();
		this.setVerde();
	},
	atualizaTempo: function(){
		if(this.estaVermelho()){
			this.inserirTrafego();
			return true;
		}

		if(this.tempoParaFechar > 0){
			this.liberarCarro();
		        this.tempoParaFechar--;
			this.write("VERDE = " +
				this.tempoParaFechar);		
			return true;
		}

		if(this.tempoParaFechar <= 0 &&
		   this.tempoParaFechar > -4){
			this.liberarCarro();
		        this.tempoParaFechar--;
			this.setAmarelo();
			this.write("AMARELO = " +
			this.tempoParaFechar);		
			return true;
		}
		
		this.write("FECHADO");		
		this.setVermelho();			
		return false;
	},
	liberarCarro: function(){
		if(this.trafegoAtual <= 0)
			this.trafegoAtual = 0;

		if(this.trafegoAtual % 2 == 0)
			this.trafegoAtual -= 1;
		else
			this.trafegoAtual -= 2;
	},
	inserirTrafego: function(){
		this.trafegoAtual += 1;
		//this.write("inserido trafego = " + this.trafegoAtual);
	},
	write: function(m){
		console.debug("SINAL " + this.nome + " : " + m);
	} 
};


/* Representa um horário de pico. */
function HorarioPico(inicio, fim){
	this.inicio = inicio;
	this.fim = fim;
}

/* Representa as ações de um horário de pico. */
HorarioPico.prototype = {
	estaEmPico: function(data){
		this.inicio = this.zerarData(this.inicio);		
		this.fim = this.zerarData(this.fim);		
		data = this.zerarData(data);		

		if(this.inicio <= data && this.fim >= data){
			return true;
		}else{
			return false;
		}
	},
	zerarData: function(data){
		return new Date(2016, 0, 1, data.getHours(), data.getMinutes(), 0);
	}
};
