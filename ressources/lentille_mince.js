var stage,depart=new createjs.Point(),foc,gamma,reel,inf=false,ob,im,sto;
var couIncident='#0F0'
var couEmergent='#0F0'
var couL='#639AFF'
var sens;
var coef=0.25;
var filtre;
var faisceau=false
var tabCou=new Array(0xFF0000,0x00FF00,0x0000FF,0x9900FF,0x00CC99,0xFFFF00,0xFFCCFF,0x33FFFF,0xFFCC00,0xFFEFEF,0x000066);
var dessineEcran=false;

function init() {
	var canv = document.getElementById("testCanvas");
	canv.style.backgroundColor='#006'
	canv.parentNode.style.backgroundColor=canv.style.backgroundColor;
	canv.width=800;
	canv.height=560;
	var w=canv.width,h=canv.height;
	var centre=new createjs.Point(w/2,h/2-44);
	stage = new createjs.Stage("testCanvas");
	stage.enableMouseOver();
	createjs.Touch.enable(stage)
	createjs.Ticker.addEventListener("tick", stage)
	//createjs.Ticker.timingMode = createjs.Ticker.RAF;

	//systeme
	var systeme = new createjs.Container();
	positionne(systeme, centre)
	
	var axe=new createjs.Shape()
	axe.graphics.beginStroke('#639AFF').moveTo(-w/2,0).lineTo(w/2,0)

	//parametres
	var A1 = {
		min : Number(document.getElementById("A1_min").value) / coef,
		max : Number(document.getElementById("A1_max").value) / coef,
		fixe : Boolean(document.getElementById("A1_fixe").checked),
		value : Number(document.getElementById("A1_value").value) /coef
	};	
	var B1 = {
		min : -(Number(document.getElementById("B1_min").value)) / coef,
		max : -(Number(document.getElementById("B1_max").value)) / coef,
		fixe : Boolean(document.getElementById("B1_fixe").checked),
		value : -(Number(document.getElementById("B1_value").value)) / coef
	};
	var lentilleHTML = {
		min : Number(document.getElementById("Lentille_min").value) / coef,
		max : Number(document.getElementById("Lentille_max").value) / coef,
		fixe : Boolean(document.getElementById("Lentille_fixe").checked),
		value : Number(document.getElementById("Lentille_value").value) / coef
	};
	var distanceFocale = {
		min : Number(document.getElementById("Curseur_min").value) / coef,
		max : Number(document.getElementById("Curseur_max").value) / coef,
		fixe : Boolean(document.getElementById("Curseur_fixe").checked),
		value : Number(document.getElementById("Curseur_value").value) / coef
	};
	var ecranHTML = {
		min : Number(document.getElementById("Ecran_min").value) / coef,
		max : Number(document.getElementById("Ecran_max").value) / coef,
		fixe : Boolean(document.getElementById("Ecran_fixe").checked),
		value : Number(document.getElementById("Ecran_value").value) / coef
	};		
	var objInfini = Boolean(document.getElementById("objInfini").checked);
	var afficherGrille = Boolean(document.getElementById("afficherGrille").checked);
	var modeFaisceau = Boolean(document.getElementById("modeFaisceau").checked);
	var afficherValeurs = Boolean(document.getElementById("afficherValeurs").checked);
	var afficheMain = Boolean(document.getElementById("afficheMain").checked);
	var afficherEcran = Boolean(document.getElementById("afficherEcran").checked);
	
	//aide
	var txtEmploi='- le curseur permet de choisir la distance focale de la lentille \n- cliquer-glisser sur le point A1 pour déplacer l\'objet, et sur le point B1 pour changer sa hauteur. Un bouton permet de le placer à l\'infini. \n- cliquer-glisser sur la lentille pour la déplacer \n- un bouton permet de choisir entre un faisceau ou 3 rayons \n- un autre bouton permet d\'afficher/cacher une grille \n- un dernier bouton permet d\'afficher/cacher les valeurs numériques \n- la palette située à gauche permet de changer la couleur des rayons ou la couleur de fond'
	var aide=new Aide(65,60,txtEmploi);
	aide.x=40;
	aide.y=40;
	if(afficheMain) {
		aide.visible = true;
	}
	else {
		aide.visible = false;
	}
	
	//bouton du fond
	var ssb = new createjs.SpriteSheetBuilder();
	var frame0 = new createjs.Container()
	var f0=new createjs.Shape(new createjs.Graphics().f('white').r(0,0,20,20));
	var tx0=new createjs.Text('fond', "bold 14px Arial", 'white');
	tx0.x=-7
	tx0.y=26
	frame0.addChild(tx0,f0)
	var f1 = new createjs.Shape(new createjs.Graphics().f('#006').r(0,0,20,20));
	var tx1=new createjs.Text('fond', "bold 14px Arial", '#006');
	tx1.x=-7
	tx1.y=26
	var frame1=new createjs.Container()
	frame1.addChild(tx1,f1)
	var bounds = new createjs.Rectangle(-20,0,50,50);
	ssb.addFrame(frame0, bounds);
	ssb.addFrame(frame1, bounds);
	var sS = ssb.build();
	var btfond = new createjs.Sprite(sS);
	btfond.gotoAndStop(0)
	btfond.cursor = "pointer";
	
	btfond.on("click",function(evt){
		evt.target.gotoAndStop((evt.target.currentFrame+1)%2);
		switch(evt.target.currentFrame){
			case 0:
		canv.style.backgroundColor='#006'
		break
		default:
		canv.style.backgroundColor='#FFF'
		
		}
		canv.parentNode.style.backgroundColor=canv.style.backgroundColor
		stage.update();
	})

	//bouton plein écran
	var btPE=new BoutonPleinEcran(canv).set({x:-350,y:270})

	//lentille
	var lentille=new Lentille(couL,0);
	if(lentilleHTML.value > lentilleHTML.max) {
		lentille.x = lentilleHTML.max;
	}
	else if(lentilleHTML.value < lentilleHTML.min) {
		lentille.x = lentilleHTML.min;
	}
	else {
		lentille.x = lentilleHTML.value;
	}
	
	lentille.on("pressmove",function(evt) {
		if(lentilleHTML.fixe === false) {
			if((evt.stageX-depart.x-systeme.x) >= lentilleHTML.min && (evt.stageX-depart.x-systeme.x) <= lentilleHTML.max) {
				evt.currentTarget.x = evt.stageX-depart.x-systeme.x;
			}
			else if((evt.stageX-depart.x-systeme.x) < lentilleHTML.min) {
				evt.currentTarget.x = lentilleHTML.min;
			}
			else if((evt.stageX-depart.x-systeme.x) > lentilleHTML.max) {
				evt.currentTarget.x = lentilleHTML.max;
			}
		}
		stage.update()
		calcule();   
	});
	var txPositionLentille = new createjs.Text('',"14px Arial",couL);
	txPositionLentille.x = 25;
	txPositionLentille.y = -120;
	txPositionLentille.visible = false;
	lentille.addChild(txPositionLentille);
	
	

	//curseur de distance focale
	var curFoc = new Curseur(-200,200,200,distanceFocale.value,distanceFocale.fixe,'#F00');
	curFoc.y = 140;
	curFoc.x=-100;
	foc = curFoc.value;
	lentille.foc=foc;

	curFoc.on("pressmove",function(evt) {
		if(curFoc.value >= distanceFocale.min && curFoc.value <= distanceFocale.max) {			
			foc=curFoc.value;
		}
		else if(curFoc.value < distanceFocale.min) {
			foc = distanceFocale.min;
			curFoc.value = distanceFocale.min;
		}
		else if(curFoc.value > distanceFocale.max) {
			foc = distanceFocale.max;
			curFoc.value = distanceFocale.max;
		}
		lentille.foc=foc;
		stage.update();
		calcule();
	})
	

	//grille
	var contGrille=new createjs.Container()
	var grille=new createjs.Shape()
	grille.alpha=0.8;
	grille.graphics.beginStroke('#999');
	for (var j = -9; j<=10; j++) {
		grille.graphics.moveTo(-400, j*20);
		grille.graphics.lineTo(400, j*20);
	}
	for (var k = -20; k<=20; k++) {
		grille.graphics.moveTo(-k*20, -180);
		grille.graphics.lineTo(-k*20, 200);
	}
	contGrille.visible=false;

	
	//echelle
	var echelle=dessineEchelle('grey')
	echelle.x=-300
	echelle.y=180
	
	contGrille.addChild(grille,echelle)
	
	
	
	//bouton "objet à l'infini"
	var btinf = new Bouton("objet à l'infini", "#50A",150);
	btinf.x=-290
	btinf.y =212;
	btinf.on("click", function(){
		inf=! inf;
		if (inf) {
			sto=new createjs.Point(pA1.x,pB1.y);
			pA1.x=-1000000;
			pB1.x=pA1.x;
			pB1.y=-1000000*sto.y/(sto.x-lentille.x);
		}
		else {
			pA1.x=sto.x;
			pB1.x=sto.x;
			pB1.y=sto.y;
		}
		calcule();
	});
	if(objInfini) {
		btinf.visible = true;
	}
	else {
		btinf.visible = false;
	}
			
//			
	//bouton "faisceau"
	var btfaisc = new Bouton("faisceau", "#50A",150);
	btfaisc.x=-290;
	btfaisc.y =250;
	btfaisc.on("click", function(){
		faisceau=!faisceau;
		calcule();
	});
	if(modeFaisceau) {
		btfaisc.visible = true;
	}
	else {
		btfaisc.visible = false;
	}
	
	//bouton "grille"
	var btgrille = new Bouton("afficher une grille", "#50A",150);
	btgrille.x=140
	btgrille.y =212;
	btgrille.on("click", function(){
		contGrille.visible=!contGrille.visible;
		calcule();
	});
	if(afficherGrille) {
		btgrille.visible = true;
	}
	else {
		btgrille.visible = false;
	}
	
	//bouton "valeurs"
	var btaff = new Bouton("afficher les valeurs", "#50A",150);
	btaff.x=140
	btaff.y =250;
	btaff.on("click", function(){
		aff.visible=!aff.visible;
		//txPositionA1.visible = !txPositionA1.visible;
		txPositionB1.visible = !txPositionB1.visible;
		txPositionB2.visible = !txPositionB2.visible;
		//txPositionLentille.visible = !txPositionLentille.visible;
		calcule();
	})
	if(afficherValeurs) {
		btaff.visible = true;
	}
	else {
		btaff.visible = false;
	}
	

	
	//rayons
	var rayons=new createjs.Shape();
//			
	//Points A1,B1,A2,B2
	var rond=new createjs.Shape();
	rond.graphics.beginFill('red').drawCircle(0,0,7);
	var rond1=new createjs.Shape();
	rond1.graphics.beginFill('red').drawCircle(0,0,7);

	var pA1=new createjs.Container();
	var pB1=new createjs.Container();
	if(A1.value > A1.max) {
		pA1.x = A1.max;
	}
	else if (A1.value < A1.min) {
		pA1.x = A1.min;
	}
	else {
		pA1.x = A1.value;
	}
	pA1.y=0;
	pB1.x=pA1.x;
	if(B1.value > B1.max) {
		pB1.y = B1.max;
	}
	else if(B1.value < B1.min) {
		pB1.y = B1.min;
	}
	else {
		pB1.y=B1.value;
	}
	pA1.hitArea=rond;
	pB1.hitArea=rond;
	
	var txA1=new createjs.Text('A1', "bold 16px Arial", '#F00');
	var txPositionA1 = new createjs.Text('', "14px Arial", '#F00');
	var txA2=new createjs.Text('A2', "bold 16px Arial", '#639AFF');
	var txB1=new createjs.Text('B1', "bold 16px Arial", '#F00');
	var txPositionB1 = new createjs.Text('', "14px Arial", '#F00');
	var txB2=new createjs.Text('B2', "bold 16px Arial", '#639AFF');
	var txPositionB2 = new createjs.Text('-120', "14px Arial", '#639AFF');
	txA1.x=-10;
	txA1.y=-10;
	txPositionA1.x = -10;
	txPositionA1.y = 30;
	txB1.x=-10;
	txB1.y=-10;
	txPositionB1.x = -45;
	txPositionB1.y = -5;
	txA2.x=-10;
	txA2.y=-10;
	txB2.x=-10;
	txB2.y=-10;
	txPositionB2.x = -10;
	txPositionB2.y = 20;
	txPositionA1.visible = false;
	txPositionB1.visible = false;
	txPositionB2.visible = false;
	
	var showA=new createjs.Shape();
	showA.graphics.setStrokeStyle(2).beginStroke('#F00').drawCircle(0,0,7);
	showA.visible=false;
	if(A1.fixe === false) {
		pA1.cursor="pointer";
		pA1.on("rollover",function(evt) {
			showA.visible=true;
		})
	}
	pA1.on("rollout",function(evt) {
		showA.visible=false;
	})
	
	var showB=new createjs.Shape()
	showB.graphics.setStrokeStyle(2).beginStroke('#F00').drawCircle(0,0,7)
	showB.visible=false;
	if(B1.fixe === false) {
		pB1.cursor="pointer";
		pB1.on("rollover",function(evt) {
			showB.visible=true;
		})
	}
	pB1.on("rollout",function(evt) {
		showB.visible=false;
	})
	
	createjs.Tween.get(showA, {loop: true})
	.to({alpha: 0}, 200)
	.to({alpha: 1}, 200)
	createjs.Tween.get(showB, {loop: true})
	.to({alpha: 0}, 200)
	.to({alpha: 1}, 200)
  
	pA1.addChild(txA1,txPositionA1,showA);
	pB1.addChild(txB1,txPositionB1,showB);
	
	
	pA1.on("mousedown",function(evt) {
		depart = evt.target.globalToLocal(evt.stageX,evt.stageY);
	})
	pA1.on("pressmove",function(evt) {
		if(A1.fixe === false) {
			if((evt.stageX-depart.x-systeme.x) >= A1.min && (evt.stageX-depart.x-systeme.x) <= A1.max) {
				pA1.x = evt.stageX-depart.x-systeme.x;
			}
			else if((evt.stageX-depart.x-systeme.x) < A1.min){
				pA1.x = A1.min;
			}
			else if((evt.stageX-depart.x-systeme.x) > A1.max){
				pA1.x = A1.max;
			}
		}
		pB1.x = pA1.x;
		calcule();
	});
	
	pB1.on("mousedown",function(evt) {
		depart = evt.target.globalToLocal(evt.stageX,evt.stageY);
	})
	pB1.on("pressmove",function(evt) {
		if(B1.fixe === false) {
			if((evt.stageY-depart.y-systeme.y) >= B1.min && (evt.stageY-depart.y-systeme.y) <= B1.max) {
				pB1.y = evt.stageY-depart.y-systeme.y;
			}
			else if((evt.stageY-depart.y-systeme.y) < B1.min) {
				pB1.y = B1.min;
			}
			else if((evt.stageY-depart.y-systeme.y) > B1.max) {
				pB1.y = B1.max;
			}
		}
		calcule(); 
	});
	sto=new createjs.Point(pA1.x,pB1.y);
//			
	//affichage
	var aff=new createjs.Container()
	aff.x=-120
	aff.y=160
	aff.visible=false
	var fondAff=new createjs.Shape()
	fondAff.graphics.setStrokeStyle(3).beginStroke('#BA01BA').beginFill('#FFCCFF').drawRect(0,0,240,100)
	var txtfoc=new createjs.Text('distance focale image : ', "bold 14px Arial", '#006666')
	txtfoc.x=10
	txtfoc.y=10
	var txtobj=new createjs.Text('position objet : ', "bold 14px Arial", '#FF0000')
	txtobj.x=10
	txtobj.y=30
	var txtimg=new createjs.Text('position image : ', "bold 14px Arial", '#000099')
	txtimg.x=10
	txtimg.y=50
	var txtgamma=new createjs.Text('grandissement : ', "bold 14px Arial", '#DD00DD')
	txtgamma.x=10
	txtgamma.y=70
	
	aff.addChild(fondAff,txtfoc,txtobj,txtimg,txtgamma);
	
	//palette de couleurs
	var paletteIncident=new createjs.Container().set({x:-380,y:10});
	var paletteEmergent=new createjs.Container().set({x:-340,y:10});
	btfond.y=-10;
	btfond.x=20;
	paletteIncident.addChild(btfond);
	var couleurs=new Array('#F00','#0F0','#00F','#90F','#0C9','#FF0','#FCF','#3FF','#FC0','#F9F','#006');
	var bt=new createjs.Shape();
	bt.graphics.beginFill(couIncident).drawRect(0,0,20,20);
	
	for (var k=0;k<=8;k++){
		var carre=new createjs.Shape();
		carre.graphics.beginFill(couleurs[k]).drawRect(0,0,20,20);
		carre.y=k*20+40;
		// carre.hitArea=bt
		carre.cursor = "pointer";
		paletteIncident.addChild(carre);
	}
	for (var k=0;k<=8;k++){
		var carre=new createjs.Shape();
		carre.graphics.beginFill(couleurs[k]).drawRect(0,0,20,20);
		carre.y=k*20+40;
		// carre.hitArea=bt
		carre.cursor = "pointer";
		paletteEmergent.addChild(carre);
	}
	
	paletteIncident.on("click", function(event){
		var icou=event.target.y/20-2;
		if(icou>=0){
			couIncident=couleurs[icou];
		//couIncident='#'+tabCou[icou].toString(16)+'\''
			ajusteCouleur(tabCou[icou]);
			sens.updateCache();
		}
		calcule();
	})
	paletteEmergent.on("click", function(event){
		var icou=event.target.y/20-2;
		if(icou>=0){
			couEmergent=couleurs[icou];
		//couEmergent='#'+tabCou[icou].toString(16)+'\''
			ajusteCouleur(tabCou[icou]);
		}
		calcule();
	})
	//sens
	sens=dessineSens('red')
	sens.set({x:-centre.x+69,y:-centre.y+119});
	//sens = new createjs.Bitmap(sens0)
	filtre = new createjs.ColorFilter(0,0,0,1,0,255,0,0); // red, green, blue, alpha
	sens.filters = [filtre];
	sens.cache(-80, 0, 150, 100);
	stage.update();

	//donne
	var donne=new createjs.Container().set({x:-160,y:-centre.y+15})

	var fl=dessineFleche(120,'#00C3AD').set({x:160,y:55})
	var txd=new createjs.Text('L', "Bold 17px Arial ", "#00C3AD").set({x:162,y:25}); 
	var txd1=new createjs.Text('lentille convergente', "Bold Italic 17px Arial ", "#00C3AD").set({x:165,y:0});
	var txd2=new createjs.Text('A1B1\n objet réel', "bold 17px Arial ", "#FF0000").set({x:55,y:50,textAlign:'center'});
	var txd3=new createjs.Text('A2B2\n image réelle', "bold 17px Arial ", "#639AFF").set({x:285,y:50,textAlign:'center'});
	txd.textAlign='center'
	txd1.textAlign='center'
	donne.addChild(fl,txd,txd1,txd2,txd3)
	
	//ecran
	var ecran = new createjs.Container();
	if(ecranHTML.value > ecranHTML.max) {
		ecran.x = ecranHTML.max;
	}
	else if(ecranHTML.value < ecranHTML.min) {
		ecran.x = ecranHTML.min;
	}
	else {
		ecran.x = ecranHTML.value;
	}
	ecran.y = 0;
	if(dessineEcran) {
		ecran.visible = true;
	}
	else {
		ecran.visible = false;
	}
	
	var txEcran = new createjs.Text('E', "Bold 17px Arial", couL).set({x:0,y:-160});
	var trait = new createjs.Shape();
	trait.graphics.beginStroke("#639AFF").moveTo(0,-140).lineTo(0,140);
	var hachure = new createjs.Shape();
	hachure.graphics.beginStroke(couL);
	for(var i = -6; i < 8; i++) {
		hachure.graphics.moveTo(0,i*20).lineTo(11,i*20 - 15);
	}
	ecran.addChild(txEcran,trait,hachure);
	
	if(ecranHTML.fixe === false) {
		ecran.cursor = "pointer";
	}
	
	ecran.on("pressmove", function(evt){
		if(ecranHTML.fixe === false) {
			if(evt.stageX-systeme.x < ecranHTML.min) {
				ecran.x = ecranHTML.min;
			}
			else if (evt.stageX-systeme.x > ecranHTML.max) {
				ecran.x = ecranHTML.max;
			}
			else {
				ecran.x = evt.stageX - systeme.x;
			}
		}
		calcule();
	})
	
	//bouton "écran"
	var btecran = new Bouton("afficher un écran", "#50A", 150);
	btecran.x = 140;
	btecran.y = 288;
	var divEcran = document.getElementById("divEcran");
	divEcran.style.visibility = ecran.visible>0 ? "visible":"hidden";
	btecran.on("click", function(){
		dessineEcran = !dessineEcran;
		ecran.visible = !ecran.visible;
		divEcran.style.visibility = ecran.visible>0 ? "visible":"hidden";
		calcule();
	})
	if(afficherEcran) {
		btecran.visible = true;
	}
	else {
		btecran.visible = false;
	}
	
	//signature
	var signature=signer('08/2018',couL).set({x:340,y:270});
	
	
	stage.addChild(systeme,aide);
	systeme.addChild(sens,axe,contGrille,lentille,curFoc,btinf,btfaisc,btgrille,btaff,btecran,rayons,aff,pA1,pB1,txA2,txB2,txPositionB2,paletteIncident,paletteEmergent,donne,ecran,signature);
	systeme.addChild(btPE);
	calcule();

			
	function calcule(){

		ob = {X:pA1.x,Y:pB1.y,reel:pA1.x<lentille.x};
		im=image(ob,lentille);
		affiche();
		rayons.graphics.clear();
		
		//console.log(A1.min,A1.max,A1.fixe,A1.value,B1.min,B1.max,B1.fixe,B1.value,lentilleHTML.min,lentilleHTML.max,lentilleHTML.fixe,lentilleHTML.value,distanceFocale.min,distanceFocale.max,distanceFocale.fixe,distanceFocale.value,afficheMain);

		fleche(rayons,ob,'#F00');
		fleche(rayons,im,'#69F');
		
		if (faisceau) {
			for (var j = -5; j<=5; j++) {
				var In=20*j;
				incident(rayons,lentille,ob,In,-w/2, w/2, 1, 5);
				emergent(rayons,lentille,im, In, -w/2, w/2, 1, 5);
			}

		}
		else{
			if (! inf) {
				incident(rayons,lentille,ob,ob.Y, -w/2, w/2, 2,8);
				emergent(rayons,lentille,im,ob.Y, -w/2, w/2, 2,8);
			}
			incident(rayons,lentille,ob,0, -w/2, w/2, 2,8);
			emergent(rayons,lentille,im,0, -w/2, w/2, 2,8);
			incident(rayons,lentille,ob,im.Y, -w/2, w/2, 2,8);
			emergent(rayons,lentille,im,im.Y, -w/2, w/2, 2,8);
		}
			
		stage.update();
	}
		
	function emergent(mc,L,img,ordo, xmin, xmax, ep, f){
		var P=new createjs.Point(img.X,img.Y);
		var pente = (img.Y-ordo)/(img.X-L.x);
		var yfin=ordo+(xmax-L.x)*pente;
		var ydeb=ordo+(xmin-L.x)*pente;
		var inci=new createjs.Point(L.x,ordo);
		var arriv=new createjs.Point(xmax,yfin);
		var penteinitiale=(ob.Y-ordo)/(ob.X-L.x);
		var yprevu=ordo+(xmax-L.x)*penteinitiale;
		var Fbis = new createjs.Point(curFoc.value + lentille.x, 0);
		
		mc.graphics.setStrokeStyle(ep).beginStroke(couEmergent);
		if (img.reel) {
			//image réelle
			rayon(mc,inci, arriv, f);
		}
		else{
			//image virtuelle
			mc.graphics.beginStroke('#AAA');
			pointille(mc,P,inci,couEmergent);
			if(curFoc.value <= 0) {
				pointille(mc,new createjs.Point(xmax,yprevu), inci, couIncident);
				if(ordo == ob.Y) {
					pointille(mc,Fbis,P,couEmergent);
				}
			}
			mc.graphics.setStrokeStyle(ep).beginStroke(couEmergent);
			rayon(mc,inci, arriv, f);
		}
	}

//
//fonctions

	function ajusteCouleur(col){
		var st=(createjs.Graphics.getRGB(col));
		var i1=st.indexOf('(')
		var i2=st.indexOf(')')
		var st1=(st.slice(i1+1,i2))
		var ar=st1.split(',')
		filtre.redOffset=ar[0]
		filtre.greenOffset=ar[1]
		filtre.blueOffset=ar[2]
	}

	function affiche(){
		txA1.y=ob.Y<0?10:-25;
		txPositionA1.y = ob.Y<0 ? 30:-45;
		txB1.y=ob.Y<0?-22:17;
		if(ob.X > 0) {
			txPositionB1.x = -15;
			if(ob.Y > 0) {
				txPositionB1.y = 40;
			}
			else {
				txPositionB1.y = -40;
			}
		}
		else {
			txPositionB1.x = -45;
			txPositionB1.y = -5;
		}
		txA2.x=im.X-10;
		txA2.y=im.Y<0?10:-25;
		txB2.x=txA2.x;
		txB2.y=im.Y<0?im.Y-22:im.Y+17;
		txPositionB2.x = txB2.x;
		txPositionB2.y = im.Y < 0 ? im.Y-42 : im.Y+37;
		txd1.text=foc>0?'lentille convergente':'lentille divergente'
		if(ob.reel){
			txd2.text='A1B1\nobjet réel'
		}
		else{
			txd2.text='A1B1\nobjet virtuel'
		}
		if(im.reel){
			txd3.text='A2B2\nimage réelle'
		}
		else{
			txd3.text='A2B2\nimage virtuelle'
		}
		txtfoc.text="distance focale image : "+(foc*coef).toFixed(1)+" cm";
		if (inf) {
			txtobj.text="objet à l'infini";
			txtimg.text="position image : "+(foc*coef).toFixed(1)+" cm";
			txtgamma.text="grandissement indéfini";
		}
		else {
			txtobj.text = "position objet : "+((ob.X-lentille.x)*coef).toFixed(1)+" cm";
			if (foc==0) {
				txtimg.text="position image : indéfinie";
				txtgamma.text="grandissement indéfini";
			}
			else {
				if (ob.X==- foc) {
					txtimg.text="position image : infini";
					txtgamma.text="grandissement indéfini";
				}
				else {
					txtimg.text = "position image : "+((im.X-lentille.x)*coef).toFixed(1)+" cm";
					txtgamma.text="grandissement : "+(im.gamma).toFixed(2);
				}
			}
		}
		txPositionA1.text = ((ob.X-lentille.x)*coef).toFixed(1);
		txPositionB1.text = -(ob.Y * coef).toFixed(1);
		txPositionLentille.text = (lentille.x * coef).toFixed(1);
		txPositionB2.text = -(im.Y * coef).toFixed(1);
	}
		
	function image(objet,L){
		var SA=objet.X-L.x;
		if (SA == -foc) {
			return {X:10000, Y:-objet.Y/foc*10000,reel:true};
		}
		else if (SA == 0) {
			return (objet);
		}
		else {
			var z1=1/SA+1/foc;
			var SA1=1/z1;
			gamma=SA1/SA;
			var y1=gamma*objet.Y;
			return {X:SA1+L.x, Y:y1,gamma:gamma, reel:SA1>=0};
		}
	}



	function rayon(mc,Pt1, Pt2, f){
			var ang=Math.atan2(Pt2.y-Pt1.y,Pt2.x-Pt1.x);
			var inter=new createjs.Point(0.5*(Pt1.x+Pt2.x),0.5*(Pt1.y+Pt2.y));
			mc.graphics.setStrokeDash([7,0], 0)
			mc.graphics.moveTo(Pt1.x,Pt1.y).lineTo(Pt2.x,Pt2.y)
			mc.graphics.moveTo(inter.x,inter.y).lineTo(inter.x+f*Math.cos(ang+2.5), inter.y+f*Math.sin(ang+2.5)).lineTo(inter.x,inter.y).lineTo(inter.x+f*Math.cos(ang-2.5), inter.y+f*Math.sin(ang-2.5)).lineTo(inter.x,inter.y);
	}

	function pointille(mc,Pt1, Pt2, couleur){
			var ang=Math.atan2(Pt2.y-Pt1.y,Pt2.x-Pt1.x);
			var inter=new createjs.Point(0.5*(Pt1.x+Pt2.x),0.5*(Pt1.y+Pt2.y));
			mc.graphics.setStrokeStyle(1).setStrokeDash([7,4], 0).beginStroke(couleur);
			mc.graphics.moveTo(Pt1.x,Pt1.y).lineTo(Pt2.x,Pt2.y);
	}
	function trajet(mc,L,obj,img,ordo,xmin,xmax,ep,f){
		incident(mc,L,obj,ordo, -w/2, w/2, 2,8);
		emergent(mc,L,imj,ordo, -w/2, w/2, 2,8);
	}
	function incident(mc,L,obj,ordo, xmin, xmax, ep, f){
		var P=new createjs.Point(obj.X,obj.Y);
		var pente = (obj.Y-ordo)/(obj.X-L.x);
		var yfin=ordo+(xmax-L.x)*pente;
		var ydeb=ordo+(xmin-L.x)*pente;
		var depart=new createjs.Point(xmin,ydeb);
		var inci=new createjs.Point(L.x,ordo);
		var F = new createjs.Point(-curFoc.value + lentille.x,0);
		var Fbis = new createjs.Point(curFoc.value + lentille.x,0);
		
		mc.graphics.setStrokeStyle(ep).beginStroke(couIncident);
		if (obj.reel) {
			//objet réel
			if (obj.X>xmin) {
				rayon(mc,P, inci, f);
			}
			else {
				rayon(mc,depart, inci, f);
			}
			if (P.x > F.x) {
				rayon(mc,F,P,f);
			}
		}
		else{
			//objet virtuel
			mc.graphics.setStrokeStyle(ep).beginStroke(couIncident);
			rayon(mc,depart, inci, f);
			if (obj.X<xmax && (P.x <= F.x || -curFoc.value <= 0)) {
				pointille(mc,new createjs.Point(L.x, ordo),new createjs.Point(xmax,yfin), couIncident);
			}
			if(F.x >= P.x) {
				pointille(mc,new createjs.Point(L.x,P.y),Fbis,couEmergent);
			}
		}
	}
}
//////////fonctions///////////

		
	
function signer(date,couL){
	var sig = new createjs.Text('GT '+date, "bold 16px Arial",couL)
	sig.lineWidth=50
	sig.textAlign = "center";
	return sig
}
function dessineEchelle(co){
	var cont=new createjs.Container()
	var f1=dessinePointe(co)
	f1.setTransform(36,0,0.7,0.7)
	var f2=dessinePointe(co)
	f2.setTransform(0,-36,0.7,0.7,-90)
	var traits=new createjs.Shape()
	traits.graphics.s(co).ss(3).mt(40,00).lt(0,0).lt(0,-40)
	var tx1=new createjs.Text('10cm',"12px Arial",co).set({x:26,y:8})
	var tx2=new createjs.Text('10cm',"12px Arial",co).set({x:-10,y:-55})
	cont.addChild(f1,f2,traits,tx1,tx2)
	return cont
}
function dessinePointe(co){
	var p=new createjs.Shape()
	p.graphics.f(co).s(co).ss(2).p("AgEAFIAEgFIgxgxIBjAxIhjAyg");
	return p
}
function dessineFleche(lon,co){
	var cont=new createjs.Container()
	var trait=new createjs.Shape()
	trait.graphics.s(co).ss(2).moveTo(-lon/2,0).lineTo(lon/2,0);
	var fl=new createjs.Shape().set({x:lon/2})
	fl.graphics.f(co).s(co).ss(2).p("AgEAFIAEgFIgxgxIBjAxIhjAyg");
	cont.addChild(trait,fl)
	return cont
}
function dessineSens(co){
	var cont=new createjs.Container()
	var txt=new createjs.Text('sens de la lumière',"bold 13px Arial", co).set({'textAlign':'center'});
	var txt1=new createjs.Text('+',"bold 16px Arial", co).set({'textAlign':'center',y:20});
	//var fl=dessinePointe(co)
	var fl=new createjs.Shape()
	fl.graphics.f(co).s(co).ss(2).p("AgEAFIAEgFIgxgxIBjAxIhjAyg").mt(-100,0).lt(0,0)
	fl.setTransform(34,17,0.7,0.7)
	cont.addChild(txt,txt1,fl)
	
	return cont
}
function fleche(mc,A,co){
	var f=-10*A.Y/Math.abs(A.Y);
	var pas=7;
	var lon=Math.abs(A.Y);
	mc.graphics.setStrokeStyle(3).beginStroke(co).setStrokeDash([7,0], 0).moveTo(A.X,A.Y).lineTo(A.X+f*Math.cos(2.2), A.Y+f*Math.sin(2.2)).moveTo(A.X, A.Y).lineTo(A.X-f*Math.cos(2.2), A.Y+f*Math.sin(2.2))
	if(!A.reel){
		mc.graphics.setStrokeDash([7,4], 0);	
	}
	mc.graphics.moveTo(A.X,A.Y).lineTo(A.X,0);
}

function positionne(ob,pt){
	ob.x=pt.x
	ob.y=pt.y
}

//parametres
function generer() {
	var original = document.getElementById("origine");
	var clone = original.cloneNode(true);
	console.log("clone de : ",clone," type : ",typeof(clone));
	var divFormulaire = clone.querySelector("#limites");
	divFormulaire.style.display = "none";
	var cloneTxt = clone.innerHTML;

	var fichier = new Blob([cloneTxt], {type: 'text/html'});
	var url = URL.createObjectURL(fichier);
	var a = document.createElement("a");
	a.href = url;
	a.download = 'TP1';
	document.body.appendChild(a);
	console.log(a);
	a.click();
	
	setTimeout(function() {
		document.body.removeChild(a);
		window.URL.revokeObjectURL(url);
	}, 0);
}

function setParametres() {
	var formulaire = document.getElementById("parametres");
	var valeur;
	var valeurDefaut;
	
	for(var i = 0; i < formulaire.length; i++) {
		type = formulaire.elements[i].type;
		//classe = formulaire.elements[i].class;
		if(type === "number") {
			valeur = Number(formulaire.elements[i].value);
			valeurDefaut = Number(formulaire.elements[i].defaultValue);
			
			if (valeur != valeurDefaut) {
				formulaire.elements[i].defaultValue = valeur;
			}
		}
		else if (type === "checkbox") {
			valeur = formulaire.elements[i].checked;
			valeurDefaut = formulaire.elements[i].defaultChecked;
			if (valeur != valeurDefaut) {
				formulaire.elements[i].defaultChecked = valeur;
			}
		}
	}
	init();
}

////////////Objets//////////////:


(function() {

	function Lentille(co,x) {
		this.Container_constructor();
		var co,focale;
		this.co=co;
		this.focale=focale;
		
		this.setup();
	}

	var p = createjs.extend(Lentille, createjs.Container);
	p.setup = function() {
		foc=100;	
		//verre
		var verre=new createjs.Shape(new createjs.Graphics().setStrokeStyle(3).beginStroke(this.co).moveTo(this.x,-120).lineTo(this.x,120))
		//this.verre=verre;
		
		//pointes
		
		var sb = new createjs.SpriteSheetBuilder();
		var f0=new createjs.Shape(new createjs.Graphics().f(this.co).drawPolyStar(0, -120, 13, 3,0,30).drawPolyStar(0, 120, 13, 3,0,-30));
		var f1=new createjs.Shape(new createjs.Graphics().f(this.co).drawPolyStar(0, -120, 13, 3,0,-30).drawPolyStar(0, 120, 13, 3,0,30));
		var bounds = new createjs.Rectangle(-25,-150,50,300);
		sb.addFrame(f0, bounds);
		sb.addFrame(f1, bounds);
		var sS = sb.build();
		pointes = new createjs.Sprite(sS);
		this.pointes=pointes;
		pointes.gotoAndStop(0);
		
		var hit=new createjs.Shape();
		this.hit=hit
		hit.graphics.beginFill('red').drawRect(-10,-130,20,260);
		this.hitArea=hit;
		
		var tL=new createjs.Text('L', "bold 16px Arial",this.co);
		this.tL=tL;
		tL.x=-4;
		tL.y=-150;
		var O=new createjs.Text('O', "bold 16px Arial",this.co);
		O.x=-25;
		O.y=8;
		this.O=O;
		
		//foyers
		var F1=new createjs.Container()
		var tF1=new createjs.Text('F', "bold 16px Arial", this.co);
		this.tF1=tF1;
		tF1.y=8;
		var lF1=new createjs.Shape()
		lF1.graphics.beginStroke(this.co).moveTo(-0,-8).lineTo(0,8);
		F1.addChild(tF1,lF1);
		
		var F2=new createjs.Container()
		var tF2=new createjs.Text('F\'', "bold 16px Arial",this.co);
		this.tF2=tF2;
		tF2.y=8;
		var lF2=new createjs.Shape()
		lF2.graphics.beginStroke(this.co).moveTo(0,-8).lineTo(0,8);
		F2.addChild(tF2,lF2);
	//
		var fleches=new createjs.Shape(new createjs.Graphics().setStrokeStyle(2).beginStroke('red').moveTo(10,-100).lineTo(30,-100).lineTo(25,-95).moveTo(30,-100).lineTo(25,-105).moveTo(-10,-100).lineTo(-30,-100).lineTo(-25,-95).moveTo(-30,-100).lineTo(-25,-105))
		fleches.visible=false;
		createjs.Tween.get(fleches, {loop: true})
		.to({alpha: 0}, 200)
		.to({alpha: 1}, 200)
		this.on("rollover",function(evt) {
			fleches.visible=true;
		})
		this.on("rollout",function(evt) {
			fleches.visible=false;
		})
		this.ajuste=function(f){
			this.focale=f
			F1.x=-f;
			F2.x=f;
			this.pointes.gotoAndStop(f<0)
		}
		this.cursor="pointer"
				  
		this.addChild(verre,pointes,tL,O,F1,F2,fleches);
		stage.update();
			
		Object.defineProperty(this, "foc", {
		get: function() { return this.focale},
		set: function(y) { this.ajuste(y)}
		})
	};
	window.Lentille = createjs.promote(Lentille, "Container");
}());

(function() {

	function Curseur(min,max,lon,valeur,fixe,cou) {
		this.Container_constructor();
		
		this.min=min;
		this.max=max;
		this.lon=lon;
		this.valeur=valeur;
		this.fixe=fixe;
		this.cou=cou;
		
		this.coef=this.lon/(this.max-this.min)
		
		this.setup();
	}
	var p = createjs.extend(Curseur, createjs.Container);
	p.setup = function() {
		var r=5,cx
		var txt = new createjs.Text('', "bold 14px Arial", this.cou);
		txt.textAlign = "center";
		txt.y = -25;
		txt.x=this.lon/2;
		this.txt=txt
		
		var ligne = new createjs.Shape();
		this.ligne=ligne
		ligne.graphics.beginStroke(this.cou).moveTo(0, 0).lineTo(this.lon, 0);
		
		var circle = new createjs.Shape();
		this.circle=circle
		circle.name='circle'
		circle.x=(this.valeur-this.min)*this.coef;
		circle.graphics.beginRadialGradientFill(["#FFF",this.cou], [0, 1], 3, 2, 0, 0, 0, r).drawCircle(0, 0, r);
		
		this.addChild(ligne, txt, circle);
		this.on("pressmove",function(evt) {
			if(evt.target.name=='circle' && this.fixe === false){
				cx=evt.localX
				cx=cx<0?0:cx
				cx=cx>this.lon?this.lon:cx
				evt.target.x = cx
				this.valeur=cx/this.coef+this.min;
			}
		})
		Object.defineProperty(this, "value", {
		get: function() { return this.circle.x/this.coef+this.min},
		set: function(y) { this.circle.x=this.coef*(y-this.min)}
		})
		if(this.fixe === false) {
			circle.cursor = "pointer";
		}
	};
	window.Curseur = createjs.promote(Curseur, "Container");
}());

//bouton de 20 pixels de haut, et de largeur par défaut 100 pixels, que l'on peut modifier
(function() {

	function Button(label, color,width) {
		this.Container_constructor();
		this.color = color;
		this.label = label;
		this.width=width;
		this.setup();
	}
	var p = createjs.extend(Button, createjs.Container);

	p.setup = function() {
		var text = new createjs.Text(this.label, "bold 14px Arial", "#FFF");
		this.text=text
		text.textBaseline = "top";
		text.textAlign = "center";
		width=(this.width==undefined?100:this.width)
		
		var height=20;
		
		text.x = width/2;
		text.y = -height*0.3;
		var w=text.getMeasuredWidth();
		text.scaleX=w>width?width/w:1;
		
		var background = new createjs.Shape();
		this.background=background;
		//background.graphics.beginFill(this.color).drawRoundRect(0,0,width,height,10);
		background.graphics.setStrokeStyle(2).beginStroke(this.color).beginLinearGradientFill(["#FFF",this.color], [0, 1], 0, -height*0.7, 0, height*0.5).drawRoundRect(0,-height*0.5,width,height,5);
		this.addChild(background, text); 
		this.on("click", this.handleClick);
		this.on("rollover", this.handleRollOver);
		this.on("rollout", this.handleRollOver);
		this.cursor = "pointer";

		this.mouseChildren = false;
		
		//this.offset = Math.random()*10;
	//	this.count = 0;
	};

	p.handleClick = function (event) {
		//alert("You clicked on a button: "+this.label);
	} ;

	p.handleRollOver = function(event) {   
		this.background.scaleY=event.type == "rollover" ? -1 : 1;
		stage.update()
	};

	window.Bouton = createjs.promote(Button, "Container");
}());


