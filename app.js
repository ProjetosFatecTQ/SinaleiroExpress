window.onload = function(){
	var ambiente = new Ambiente();	
};

/* Representa o ambiente e suas características onde as vias estão. */
function Ambiente(){
	/* Tempo está chuvoso? */
	this.chuva = true;

	/* Lista de horários de picos */	
	this.picos = [];
	/* Novo pico das 7:00h às 9:00h */
	this.inserePico(
			new Date(2016, 01, 01, 7, 0, 0), 
			new Date(2016, 01, 01, 9, 0, 0)
	);
	/* Novo pica das 17:30h às 20:30h */
	this.inserePico(
			new Date(2016, 01, 01, 17, 30, 0), 
			new Date(2016, 01, 01, 20, 30, 0)
	);

	/* Lista de semáforos. */
	this.semaforos = [];
	/* Semáforo Rua: 
	   - 20 segundos tempo padrão;  
	   - 2 = inicia verde.
	   - 25 carros limite de tráfego
	   - FALSE não recebe influência do horário de pico
	   - FALSE não recebe influência da chuva
	*/
	this.insereSemaforo("RUA", 20, 2, 25, false, false);
	/* Semáforo Avenida: 
	   - 30 segundos tempo padrão;  
	   - 3 = inicia vermelho.
	   - 40 carros limite de tráfego
	   - TRUE = recebe influência do horário de pico
	   - TRUE = recebe influência da chuva
	*/
	this.insereSemaforo("AVE", 30, 3, 40, true, true);
	
	/* Atualiza semáforos a cada 1 segundo. */
	setInterval(this.atualiza.bind(this), 1000);	
}
/* As ações do ambiente. */
Ambiente.prototype = {
	atualiza: function(){
		/* Iteração nos semáforos existentes para realizar a atualização. */
		for(var i = 0; i < this.semaforos.length; i++){
			/* Atualiza o semáforo e verifica se já fechou (retorna false). */
			if(!this.semaforos[i].atualizaTempo()){
				/* Abre o outro semáforo. */
				this.abrirOutro(this.semaforos[i]);
				return;
			}
		}
		
	},
	/* Abre o outro semáforo. */
	abrirOutro: function(semaforo){
		for(var i = 0; i < this.semaforos.length; i++){
			if(this.semaforos[i].nome != semaforo.nome){
				this.abrirSemaforo(this.semaforos[i]);
				return;
			}
		}
	},
	/* Verifica se a hora atual está em algum horário de pico. */
	estaEmHorarioDePico: function(){
		for(var i = 0; i < this.picos.length; i++){
			if(this.picos[i].estaEmPico(new Date())){
				return true;
			}
		}

		return false;
	},
	/* Insere um novo horário de pico. */
	inserePico: function(inicio, fim){
		this.picos.push(
			new HorarioPico(inicio, fim)
		);
	},
	/* Configura o semáforo como verde. */
	abrirSemaforo: function(s){
		s.setVerde();		
		s.abrir(this.chuva, this.estaEmHorarioDePico());

	},
	/* Insere um novo semáforo. */
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
	/* Identifica se o semáforo está AMARELO (1), VERDE (2) ou VERMELHO (3) */
	this.status = null;
	/* Tempo do sinal amarelo. */
	this.tempoAmarelo = 4;
	/* Representa o tempo padrão no semáforo. */
	this.tempoPadrao = tempoPadrao;
	/* Armazena o tempo para fechar o semáforo quando abre-se o mesmo. */
	this.tempoParaFechar = null;
	/* Representa a quantidade de veículos na via. */
	this.trafegoAtual = 0;
	/* Representa o limite de veículos na via para acrescentar o acréscimo. */
	this.limiteTrafego = limiteTrafego;
	/* Diz se a via recebe acréscimo de tempo reference ao horário de pico. */
	this.recebeHorario = recebeHorario;
	/* Diz se a via recebe acréscimo de tempo referente à chuva */
	this.recebeChuva = recebeChuva;
	/* Armazena a informação se está chovendo no momento. */
	this.estaChovendo = null;
	/* Armazena a informação se está em um horário de pico. */
	this.estaHorarioPico = null;
	/* Representa o limite máximo dos acréscimos. */
	this.limiteAcrescimo = 10;
}

/* Representa as ações de um semaforo. */
Semaforo.prototype = {
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
	/* Retorna o tempo que o sinal deve ficar VERDE com os ACRÉSCIMOS. */
	getTempoVerde: function(){
		var tempo = this.tempoPadrao - this.tempoAmarelo;

		var acrescimo = 0;
		if(this.estaComTrafegoAlto()){
			this.write("TRAFEGO +5s | LIMITE CARROS: " + this.limiteTrafego);
			acrescimo += 5;
		}else{
			this.write("TRAFEGO +0s | LIMITE CARROS:" + this.limiteTrafego);
		}

		if(this.estaChovendo && this.recebeChuva){
			this.write("CHUVA +5s");
			acrescimo += 5;
		}

		if(this.estaHorarioPico && this.recebeHorario){
			this.write("HORARIO PICO: +5s");
			acrescimo += 5;
		}

		if(acrescimo > this.limiteAcrescimo)
			acrescimo = this.limiteAcrescimo;

		var total = tempo + acrescimo;			

		this.write("TEMPO " + tempo + "s | ACRESCIMO " + acrescimo + "s | TOTAL " + total + "s");

		return total;
	},
	/* Configura o sinal como VERDE. */
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
	/* Atualiza o tempo do sinal. */
	atualizaTempo: function(){
		/* Se ele está vermelho, inserir tráfego na via. */
		if(this.estaVermelho()){
			this.inserirTrafego();
			return true;
		}

		/* Se o tempo para fechar não acabou, liberar carros da via. */
		if(this.tempoParaFechar > 0){
			this.liberarCarro();
		        this.tempoParaFechar--;
			this.write("VERDE | TEMPO " +	this.tempoParaFechar + "s ");		
			return true;
		}

		/* Se o tempo para fechar acabou e está dentro do tempo do sinal AMARELO,
		   liberar carro. */
		if(this.tempoParaFechar <= 0 &&
		   this.tempoParaFechar > (this.tempoAmarelo * -1)){
			this.liberarCarro();
		        this.tempoParaFechar--;
			this.setAmarelo();
			this.write("AMARELO | TEMPO " + this.tempoParaFechar + "s ");		
			return true;
		}
		
		/* Se o tempo de VERDE e AMARELO acabou, fechar o semáforo. */
		this.write("VERMELHO");		
		this.setVermelho();			
		return false;
	},
	/* Libera carro da via. */
	liberarCarro: function(){
		if(this.trafegoAtual <= 0){
			this.trafegoAtual = 0;
			return;
		}

		if(this.trafegoAtual % 2 == 0)
			this.trafegoAtual -= 1;
		else
			this.trafegoAtual -= 2;
	},
	/* Insere carros na via. */
	inserirTrafego: function(){
		this.trafegoAtual += 1;
	},
	/* Verifica se o limite de tráfego foi ultrapassado. */
	estaComTrafegoAlto: function(){
		return this.trafegoAtual > this.limiteTrafego;
	},
	write: function(m){
		var l = "SINAL " + this.nome + " | " + m + " | TRÁFEGO: " + this.trafegoAtual + " carros |";
		console.debug(l);
	} 
};


/* Representa um horário de pico. */
function HorarioPico(inicio, fim){
	/* Representa a hora de início do horário de pico. */
	this.inicio = inicio;
	/* Representa a hora de fim do horário de pico. */
	this.fim = fim;
}

/* Representa as ações de um horário de pico. */
HorarioPico.prototype = {
	/* Verifica se a hora passada está no horário de pico. */
	estaEmPico: function(data){
		this.inicio = this.zerarData(this.inicio);		
		this.fim = this.zerarData(this.fim);		
		data = this.zerarData(data);		

		return this.inicio <= data && this.fim >= data;
	},
	/* Desconsidera a data para verificação do horário. */
	zerarData: function(data){
		return new Date(2016, 0, 1, data.getHours(), data.getMinutes(), 0);
	}
};
