// Asicosilomu 2023

// Un magazin online care se poate pune pe un host static (gen GitHub Pages) sau chiar folosit direct din fișier!
// Acest sistem nu este unul optim, dar care funcționează oricum.
// Acesta funcționează folosind Google Forms ca un backend, scriind în mod automat date într-un formular Google (posibil doar datorită existenței formResponse pe link-urile precompletate), și astfel generând intrări logice într-un sheet care este asociat formularului.
// Formularul constă în cinci câmpuri, care sunt folosite în mod econom de acest script.

// Atunci când se trimite o comandă, se fac următoarele:
// -> Se creează câteva iframe-uri, într-o ordine logică, la anumite intervale. În acestea se încarcă niște link-uri făruite în mod dinamic de către script.
// -> Ca un rezultat, iframe-urile încarcă aceste link-uri, iar deoarece se folosește formResponse, răspunsurile precompletate sunt trimise automat fără să fie necesară intervenția utilizatorului. Iframe-urile sunt păstrate ascunse de acesta.
// -> Google primește datele, iar răspunsurile sunt înregistrate în formular.
// -> Apoi datele sunt copiate în sheet-ul asociat formularului, acestea creând intrări logice, ușor de citit, care formează o comandă.

// La înregistrarea unei comenzi, în sheet se adaugă următoarele. Să zicem că Nea Doru dorește să comande 69 de pungi de mâncare de pisici Whiskas, pe 5 iunie 2023, la ora 16:18:58.

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
// 05.06.2023 16:18:58 // -  //          //                        //              //          //            //
// 05.06.2023 16:18:59 // Nu // Nea Doru // neadoru@gmail.com      // 0761 123 123 // Nea Doru // Strada BMG //
// 05.06.2023 16:19:00 // -  //       69 // Mâncare Pisici Whiskas //    2.415 RON //   35 RON //  2.415 RON //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Orele variază din cauza întârzierii dintre trimiteri. Această întârziere nu este de mai mult de 2 - 3 sec.
// Primul rând este un separator, pentru a delimita comenzile între ele.
// Al doilea rând conține pe a doua coloană starea comenzii, care se modifică în Da atunci când comanda este finalizată. Ulterior sunt numele, email-ul, nr.de tel, magazinul și adresa magazinului lui Nea Doru.
// Următoarele rânduri, câte unul pentru fiecare produs comandat, au pe a doua coloană un -, unde ar trebui să fie starea comenzii. Acest - există peste tot pe coloana 2 în sheet-ul nostru, doar nu pe rândul cu datele comenzii. Ulterior, se găsesc cantitatea, numele produsului, prețul total al produsului, prețul unitar. Pe coloana 6 (ultima) se găsește totalul comenzii, care este identic la toate rândurile de produse. Acesta reprezintă suma totală a comenzii, adică prețurile totale ale tuturor produselor adunate. 

// Comenzile se găsesc în acest format, ușor de distins unele de altele.

// Configurări
var config = {
	// Numele magazin
	"storename": "Masimo Candy BMG",
	// Monedă: romînească.
	"currency": "RON",
	// Calea către formularul nostru, care e practic magia care face acest magazin online serverless să funcționeze.
	// serverless = fără backend, adică poți să-l pui pe un host static
	// :)
	//"gformURL": "https://docs.google.com/forms/d/e/1FAIpQLScJ_6FM10YUgwYYorjqgh8ECBXdSknUHKNR4pxkkMA0gedK2Q/formResponse?usp=pp_url&entry.2124707722=FIELD0&entry.1332132387=FIELD1&entry.1909270573=FIELD2&entry.538774890=FIELD3&entry.1373236390=FIELD4&entry.118283064=FIELD5&entry.822357408=FIELD6"
	"gformURL": "https://docs.google.com/forms/d/e/1FAIpQLSd0q4lF1wYOba5V7bTdHmBOyapKYiNUO1Vd-YmJ7mNJZN1kYA/formResponse?usp=pp_url&entry.1769074895=FIELD0&entry.443930057=FIELD1&entry.1701671710=FIELD2&entry.85262525=FIELD3&entry.1118109715=FIELD4&entry.818772431=FIELD5&entry.371274289=FIELD6"
};

// Cînd se ancarcă modelul de obiect al documentului /jk
window.addEventListener("DOMContentLoaded", function() {

// Procesare parametri
function parseURLParams() {
	// CHINEZĂ ABSOLUTĂ!!!!
	var urlParams = window.location.search
	var getQuery = urlParams.split('?')[1]
	if (!getQuery) return [];
	var params = getQuery.split('&')
	return params;
}

// Procurare facilă a datelor de utilizator
function ug(k) { return JSON.parse(localStorage.getItem(k)); };
function us(k, v) { return localStorage.setItem(k, JSON.stringify(v)); };

// Setare dinamică meta description
function setMetaDesc(d) {
	document.querySelector("#metadesc").content = d.toString();
}

// Inițializare date
if (ug("ok") == null) {
	us("ok", true);
	us("cart", {});
	us("name", "");
	us("email", "");
	us("phone", "");
	us("cnp", "");
	us("cui", "");
	us("biz", "");
	us("regcom", "");
	us("address", "");
	us("isfiz", false);
	us("history", []);
}

/* Funcție pentru obținerea unui identificator unic de comandă, sigur din punct de vedere criptografic.
function getOrderID() {
	return ""+(self["cr"+"YPTO".toLowerCase()]["geT".toLowerCase()+"RandomVal"+"UES".toLowerCase()])(new Uint32Array(1))[69-(Math.floor(69.69))].toString()+(function(){return {"toString":(self[("d".toUpperCase())+"a"+"t"+"         E        ".trim().toLowerCase()][`${"n"}${"o"}${"w"}`])}})();
};*/

// Creem elementul HTML în sine care reprezintă un produs în catalog/coș.
function createProductElement(pr, onchange, controls = true, fakecart) {
	// Creem un div.
	var e = document.createElement("div");
	// Îl facem div de produs.
	e.classList.add("product");
	// Îi băgăm niște HTML hardcoded că mi-e lene.
	// Sunt foarte conștient de faptul că am creat o mare vulnerabilitate XSS dar serios, eu sunt singurul care pot introduce date în catalog.
	e.innerHTML = `<div class="container-bottom"><h3>${pr.name}</h3><p>Cod: ${pr.plu}<br>${pr.gr}/buc<br>${pr.bax}<br>${pr.price.toString()} ${config.currency}/${pr.unit}</p><button class="subtract">-</button><button class="qt">${(fakecart||ug("cart"))[pr.plu.toString()]||0}</button><button class="add">+</button>&nbsp;&nbsp;<button class="imgvb">IMG</button></div>`;
	// Punem și fundal dacă se poate.
	if (pr.image) { e.style.backgroundImage = `url(${pr.image})`; };
	// buton img
	e.querySelector(".imgvb").addEventListener("click", function() {
		window.location.href = "?page=imgview&img=" + pr.image.replace("./images/", "") + "&alt=" + pr.name;
	});
	if (!controls) {
		e.querySelector(".subtract").remove();
		//e.querySelector(".qt").remove();
		e.querySelector(".add").remove();
	} else {
	// Atunci când utilizatorul vrea să introducă cantitatea de la tastatură
	e.querySelector(".qt").addEventListener("click", function() {
		var cart = ug("cart");
		// Cantitatăm cantitatea.
		var v = prompt("Introduceți cantitatea:", cart[pr.plu.toString()] || 0) || 0;
		// Vedem dacă ete bună.
		if (v && !isNaN(Number(v)) && Number(v) >= 0) { cart[pr.plu.toString()] = Math.floor(Number(v));
		us("cart", cart);
		e.querySelector(".qt").innerText = cart[pr.plu.toString()];
		onchange();}
	});
	// Scădem 1 de la cant.
	e.querySelector(".subtract").addEventListener("click", function() {
		var cart = ug("cart");
		var v = cart[pr.plu.toString()] || 0;
		if (v > 0){
			v--;
			cart[pr.plu.toString()]=v;
			us("cart", cart);
			e.querySelector(".qt").innerText = cart[pr.plu.toString()];
			onchange();
		}
	});
	// Adăugim unu la cant.
	e.querySelector(".add").addEventListener("click", function() {
		var cart = ug("cart");
		var v = cart[pr.plu.toString()] || 0;
		//if (v > 0){
		v++;
		cart[pr.plu.toString()]=v;
		us("cart", cart);
		e.querySelector(".qt").innerText = cart[pr.plu.toString()];
		onchange();
						//}
	});
	}
	return e;
};

// Creere desc categorie
function createCategoryDesc(ct, cat) {
	let products = ct.querySelectorAll(".product"); let str = `În categoria ${cat} găsiți ${products.length.toString()} produse, inclusiv `; for (let i = 0; i < products.length; i++) {
	if ((i + 1) == products.length) { str += " și "; } else if (i > 0) { str += ", " };
str += products[i].querySelector("h3").innerText;
if ((i + 1) == products.length) str += ".";
}
return str;
}

// Procesarea produselor. Aici are loc toată magia.
function loadProducts(page) {
	setMetaDesc("De pe site-ul nostru puteți comanda gume, jeleuri, licorice, acadele, comprimate, pufoase, jucării și suc.");

	var par = parseURLParams();
	var cat = "";
	for (var i = 0; i < par.length; i++) {
		var s = par[i].split("=");
		if (s[0] == "category") {
			cat = s[1];
		}
	}
	// Containerul.
	var cont = page.querySelector(".list");
	// Ce e asta? Nici eu nu mai știu și mi-e lene să mă uit în inspector.
	// Nvm. E containerul în care se încarcă individual produsele la selectarea unei categorii.
	var ct = page.querySelector(".ct");
	// O variantă iterabilă a catalogului de produse.
	var en = Object.entries(Catalog);
	// Lista principală?
	let loadlist = true;
	for (i = 0; i < en.length; i++) {
		//console.warn(en[i][0], decodeURIComponent(cat));
		if (en[i][0] == decodeURIComponent(cat)) {
			loadlist = false;
			let c = en[i][1];
			let n = en[i][0];
			// Încărcăm elementele din categoria respectivă. Desigur cu createProductElement.
			ct.innerHTML = "<center></center>";
			ct = ct.querySelector("center");
			// Titlul paginii.
			var h1 = page.querySelector("h1");
			// Îl golim.
			h1.innerHTML = "";
			// Buton Înapoi.
			var btnback = document.createElement("button");
			btnback.style.marginRight = "10px";
			btnback.style.paddingTop = "10px";
			btnback.style.paddingBottom = "10px";
			let parts = window.location.href.split("?");
			let params = new URLSearchParams(parts[1]);
			params.delete("category");
			// Ce să fac și eu dacă nu vor addEventListener sau onclick să meargă sub nicio formă?
			//btnback.innerHTML = `<a style="text-decoration: none; color: initial;" href="${parts[0] + "?" + params.toString()}">&lt; Înapoi</a>`;
			//btnback.style.fontSize = "inherit";
			//h1.appendChild(btnback);
			h1.innerHTML += `Categorie: ${n}`;
			for (var i = 0; i < c.length; i++) {
				ct.appendChild(createProductElement(c[i]));
			}
			setMetaDesc(createCategoryDesc(ct, n));
			break;
		}
	}
	if (loadlist) {
	for (var i = 0; i < en.length; i++) {
		// Creem un div, un element listal mai exact. :))
		var el = document.createElement("div");
		el.classList.add("listitem");
		// Îl populăm.
		el.innerText = en[i][0];
		// Funcție wrapper ca să nu se duduie scope-ul.
		function ad(c, n) {
			// Programăm botonașul.
			el.addEventListener("click", function() {
				window.location.search = `?page=products&category=${n}`;
			});
		};
		// Apelăm funcția noastră anti-duduială.
		ad(en[i][1], en[i][0]);
		// Adăugăm elementul, care reprezintă o categorie a catalogului.
		cont.appendChild(el);
	}
	};
}

// PRODUS DUPA PLU
function querySku(sku) {
	let cate = Object.entries(Catalog);
	for (let i = 0; i < cate.length; i++) {
		let dt = cate[i][1];
		for (let j = 0; j < dt.length; j++) {
			if (dt[j].plu == sku) return dt[j];
		}
	}
}

// Aplicația în sine.
function main() {
	// Încărcăm pagina dorită de utilizator.
	
	// Procesăm informația despre pagina dorită.
	var par = parseURLParams();
	var pag = "";
	for (var i = 0; i < par.length; i++) {
		var s = par[i].split("=");
		if (s[0] == "page") {
			pag = s[1];
		}
	}

	// Încărcăm pagina corespunzătoare.

	// Callback-uri
	var callbacks = {
		"search": function (page) {
			setMetaDesc("Căutați produse în catalogul Masimo Candy BMG.");
			let sq = page.querySelector("input");
			let sb = page.querySelector("#searchBtn");
			let re = page.querySelector("#searchResults");

			sb.addEventListener("click", () => {
				let q = sq.value;
				re.innerHTML = "";
				let catEnt = Object.entries(Catalog);
				for (let i = 0; i < catEnt.length; i++) {
					let cat = catEnt[i][1];
					for (let j = 0; j < cat.length; j++) {
						if (cat[j].name.toLowerCase().search(q.toLowerCase()) != -1) re.appendChild(createProductElement(cat[j]));
					};
				}
			});
		},
		// Highlights
		"home": function (page) {
			setMetaDesc("Faceți o comandă pe site-ul Masimo Candy BMG.");

			let recCont = page.querySelector("#prodRec");

			// PRODUSE RECOMANDATE //
			let recs = ["2001", "2008", "7006", "3005", "7012", "5002", "5005", "1001"];
			// PRODUSE RECOMANDATE //
			
			for (let i = 0; i < recs.length; i++) recCont.appendChild(createProductElement(querySku(recs[i])));

			// Butoane derulante
			let leftbtn = page.querySelector(".left");
			leftbtn.addEventListener("click", () => {
				recCont.scrollBy(-305, 0);
			});
			let rightbtn = page.querySelector(".right");
			rightbtn.addEventListener("click", () => {
				recCont.scrollBy(305, 0);
			});
		},
		// Pagina de produse.
		"products": loadProducts,
		// IMGVIEW
		"imgview": function (page) {
			let img = "";
			let alt = "";
			for (var i = 0; i < par.length; i++) {
				var s = par[i].split("=");
				if (s[0] == "img") img = s[1];
				if (s[0] == "alt") alt = s[1];
			}
			alt = decodeURI(alt);
			if (img != "") {
				// ImgEL
				let iel = page.querySelector("img");
				iel.src = "./images/" + img;
				iel.alt = alt || img;
				setMetaDesc(iel.alt);
				page.querySelector("h1").innerText = alt || img;
			} else {
				page.innerHTML += "<h3>Imaginea nu a fost găsită.</h3>";
			}
		},
		// TOP SEKRET
		"androidconv": function (page) {
			setMetaDesc("Convertiți datele catalogului din Catalog Mobil by AsI într-un format acceptat de Magazinul Online.");

			let cont = page.querySelector("div");
			let t1 = cont.querySelector("#cmdata");
			let t2 = cont.querySelector("#outdata");
			let btn = cont.querySelector("button");
			btn.addEventListener("click", () => {
				//alert("Bienvenue!");
				let data = t1.value;
				// TVA HARDCODIFICAT!!
				let tva = {"Normal": 9};
				if (data) {
					try {
						let result = {"Necategorizat": []};
						data = JSON.parse(data);
						    function calcTva(tv, pret, diff=false) {         let val = tv;         if (diff) { return ((pret * val) / 100).toString(); } else { return (Number(pret) + ((pret * val) / 100)).toString(); };     };
						for (let i = 0; i < data.length; i++) {
							let o = data[i];
							if (o.sku) {
							o.bax = o.baxaj || "";
							if (o.baxaj) delete o.baxaj;
							if (o.img) o.img = o.img.replace("/sdcard/catalog.mobil/", "./images/");
							o.image = o.img || "";
							if (o.img) delete o.img;
							//if (o.price && o.tva) o.price = calcTva(tva[o.tva], o.price);
							if (o.price) {} else { o.price = 0; };
							if (o.uprice) delete o.uprice;
							o.plu = o.sku;
							if (o.sku) delete o.sku;
							o.unit = "buc";
								if (o.coment) delete o.coment;
								if (o.tva) delete o.tva;
							if (o.cat) {if (result[o.cat]) {} else { result[o.cat] = []; };
							result[o.cat].push(o);
							delete o.cat;
							} else { result.Necategorizat.push(o); };
							}
						}
						console.log(data);
						t2.value = JSON.stringify(result);
					} catch(e) {
						alert(e.toString());
					};
				} else {
					alert("fara date!");
				};
			});
		},
		// Pagina Istoric comenzi.
		"history": function (page) {
			setMetaDesc("Vezi comenzile făcute în trecut.");

			// Container istoric.
			let cont = page.querySelector("div");
			// Ancarcam hstul
			let hst = ug("history");
			for (let i = hst.length - 1; i >= 0; i--) {
				let hstentry = hst[i];
				if (hstentry) {
					let el = document.createElement("center");
					// REDUCEM, REUTILIZĂM, RECICLĂM!
					el.className = "header";
					let hd = document.createElement("h1");
					hd.innerText = `${hstentry.canceled ? "ANULAT\n" : ""}Comandă${hstentry.date ? " de pe " + hstentry.date : ""}`;
					el.appendChild(hd);

					let plus = [];
					// Iterabil HST
					let heit = Object.entries(hstentry);
					for (let k = 0; k < heit.length; k++) {
						plus.push(heit[k][0]);
					}

					let prods = [];
					// Variantă iterabilă a catalogului de produse.
					var categ = Object.entries(Catalog);
					for (let l = 0; l < categ.length; l++) {
					// Pentru fiecare categorie, trecem prin produse.
					var ca = categ[l][1];
					console.log(ca);
					for (var j = 0; j < ca.length; j++) {
					// Dacă PLU-ul produsului este în lista noastră, iar cantitatea acestuia din coș este mai mare de 0, îl introducem în prods.
					console.log(ca[j]);
					if (plus.indexOf(ca[j].plu.toString()) != -1 && hstentry[ca[j].plu.toString()] > 0) prods.push(ca[j]);
				}}
					console.log(prods);
				for (let m = 0; m < prods.length; m++) {
					el.appendChild(createProductElement(prods[m], function(){}, false, hstentry));
				}
					let tothd = document.createElement("h2");
					tothd.innerText = `Total: ${hstentry.total ? hstentry.total + " " + config.currency : "Necunoscut"}`;
					el.appendChild(tothd);
					let btnrem = document.createElement("button");
					btnrem.innerText = "Eliminare";
					//btnrem.className = "unstyled";
					el.appendChild(btnrem);
					function evw(z) {
					btnrem.addEventListener("click", function() {
					if (confirm("Doriți să ștergeți această comandă din istoric? Aceasta nu va fi anulată, ci doar ștearsă!")) {let hst = JSON.parse(localStorage.getItem("history"));
					hst[z] = undefined;
					localStorage.setItem("history", JSON.stringify(hst));
					document.location.reload();}});
					};
					evw(i);
					let btncan = document.createElement("button");
					btncan.innerText = "Anulare";
					function evwc(z) {
						console.warn("CANev");
						btncan.addEventListener("click", function() {
							if (confirm("Dacă anulați această comandă, aceasta nu va mai fi finalizată. Anularea nu are efect dacă ați primit deja comanda.")) {
								if (confirm("Sunteți 10000000% sigur?")) {
									let dialog = document.createElement("dialog");
									dialog.innerHTML = `<h3>Se anulează comanda...</h3><progress></progress> <span>0%</span>`;
									let prg = dialog.querySelector("progress");
									let sp = dialog.querySelector("span");
									let curprog = 0;
									let maxprog = 2;
			
function addProgress() {
	curprog++;
	prg.value = curprog;
	prg.max = maxprog;
	sp.innerText = `${curprog / maxprog * 100}%`;
									}
									let ifr1 = document.createElement("iframe");
					ifr1.src = config.gformURL.replace("FIELD1", "").replace("FIELD0", "-").replace("FIELD2", "").replace("FIELD3", "").replace("FIELD4", "").replace("FIELD5", "").replace("FIELD6", "");
					ifr1.addEventListener("load", () => {
						addProgress();
						let ifr2 = document.createElement("iframe");
						let izf = ug("isfiz");
						let f2 = izf ? ug("name") : ug("biz");
						let f3 = ug("email");
						let f4 = ug("phone");
						let f5 = izf ? ug("cnp") : ug("cui");
						let f6 = izf ? "" : ug("regcom");
						ifr2.src = config.gformURL.replace("FIELD2", f2).replace("FIELD0", "ANUL").replace("FIELD3", f3).replace("FIELD4", f4).replace("FIELD5", f5).replace("FIELD6", f6).replace("FIELD1", ug("history")[z].date.split(", ")[1] + " " + ug("history")[z].date.split(", ")[0]);
						ifr2.addEventListener("load", function(){addProgress();setTimeout(function(){alert("Cererea de anulare a fost trimisă.");},250);setTimeout(function(){dialog.close();let mhst = ug("history");mhst[z].canceled = true;us("history", mhst);document.location.reload();}, 250);});
						ifr2.className = "magic";
						dialog.appendChild(ifr2);
});
ifr1.className = "magic";
dialog.appendChild(ifr1);
									document.body.appendChild(dialog);
									dialog.showModal();
								}
							}
						});
					};
					evwc(i);
					if (hstentry.canceled) {} else { el.appendChild(btncan); };
					cont.appendChild(el);
					cont.appendChild(document.createElement("BR"));
				}
			}
		},
		"about": function (page) {
			setMetaDesc("Vedeți informații despre firma noastră.");
		},
		// Pagina Coș de cumpărături.
		"cart": function (page) {
			setMetaDesc("De pe site-ul nostru puteți comanda gume, jeleuri, licorice, acadele, comprimate, pufoase, jucării și suc.");

			// Container produse
			var cont = page.querySelector("center");
			// Text total
			var tot = page.querySelector("h2");
			// Conținutul coșului
			var cart = ug("cart");
			// PLU-urile produselor din coș
			var plus = [];
			// O variantă iterabilă a datelor din coș.
			var entries = Object.entries(cart);
			// Populăm lista cu PLU-urile
			for (var i = 0; i < entries.length; i++) {
				plus.push(entries[i][0]);
			}
			// Debug
			console.log(plus);
			// Array produse
			var prods = [];
			// Funcție care încarcă array-ul cu toate produsele din coș, în cantitate peste 0.
			function loadProd() {
			prods = [];
			// Variantă iterabilă a catalogului de produse.
			var categ = Object.entries(Catalog);
			for (var i = 0; i < categ.length; i++) {
				// Pentru fiecare categorie, trecem prin produse.
				var ca = categ[i][1];
				console.log(ca);
				for (var j = 0; j < ca.length; j++) {
					// Dacă PLU-ul produsului este în lista noastră, iar cantitatea acestuia din coș este mai mare de 0, îl introducem în prods.
					console.log(ca[j]);
					if (plus.indexOf(ca[j].plu.toString()) != -1 && ug("cart")[ca[j].plu.toString()] > 0) prods.push(ca[j]);
				}
			}
			console.log(prods);
			}
			loadProd();
			// Funcție care calculează totalul. Ez.
			// Se poate specifica raw = true iar funcția nu va actualiza totalul din pagina HTML, ci doar va da return la valoare.
			function calcTotal(raw) {
				var total = 0;
				// Pentru fiecare produs facem anmultire
				for (var i = 0; i < prods.length; i++) {
					total += prods[i].price * ug("cart")[prods[i].plu.toString()];
				}
				// puterea luari de decizi :))))))))
				if (raw) return total;
				// Nu mai folosim else deoarece return iese oricum din funcție, iar rahatul ăsta de jos oricum nu se mai execută. Iată, am economisit câțiva octeți :)
				tot.innerText = `Total: ${total.toString()} ${config.currency}`;
			}
			// Funcție pentru a popula pagina HTML cu elementele din coș.
			function prodElsLoad() {
			for (var i = 0; i < prods.length; i++) {
				cont.appendChild(createProductElement(prods[i], calcTotal));
			}
			}
			// sun ambele functi
			prodElsLoad();
			calcTotal();

			// Logica comandării
			
			let rf = page.querySelector("#pers_fiz");
			let rj = page.querySelector("#pers_jur");
			let ff = page.querySelector("#form_fiz");
			let fj = page.querySelector("#form_jur");

			function lis() {
				let s = rf.checked;
				ff.style.display = rf.checked ? "block" : "none";
				fj.style.display = !rf.checked ? "block" : "none";
			};

			rf.addEventListener("change", lis);
			rj.addEventListener("change", lis);

			rf.checked = ug("isfiz");
			rj.checked = !rf.checked;

			lis();

			// Încărcăm datele salvate în câmpuri.
			var fields = ["name", "email", "phone", "address", "cnp", "biz", "cui", "regcom"];
			for (var i = 0; i < fields.length; i++) {
				page.querySelector("#" + fields[i]).value = ug(fields[i]);
			}

			// Atunci când este confirmată comanda.
			page.querySelector("#orderSend").addEventListener("click", function () {
				// Verificare Integritate Date (VID)
				let fieldsfq = ["name", "cnp", "phone", "address"];
				let fieldsjq = ["biz", "cui", "regcom", "phone", "address"];
				let fieldsq = rf.checked ? fieldsfq : fieldsjq;

				for (let i = 0; i < fieldsq.length; i++) {
					let fieldel = page.querySelector("#" + fieldsq[i]);
					if (fieldel.value == undefined || fieldel.value == null || fieldel.value.trim() == "") {
						let fieldtext = page.querySelector(`label[for=${fieldsq[i]}]`).innerText;
						alert("Câmpul „" + fieldtext.substr(0, fieldtext.length - 1) + "” este obligatoriu!");
						return;
					};
				};

				// ID COMANDA
				//let orderid = getOrderID()["toString"]();
				let orderDate = "";

				// Calculăm totalul.
				var t = calcTotal(true);
				// Haha
				loadProd();
				//console.log(prods);
				var magic = page.querySelector(".magic");
				// Dacă comanda are produse, cerem o ultimă confirmare din partea utilizatorului.
				if (prods.length > 0) {
				if (confirm(`Această comandă are valoarea de ${t} ${config.currency}. Sunteți sigur/ă că doriți să continuați? Selectați opțiunea "OK" pentru a continua.`)) {
					// Lansăm comanda.
					console.warn("Lansare cmd.");

					// Prevenim anularea accidentală a comenzii, ce poate duce la trimiterea unor date incomplete.
					window.onbeforeunload = function (event) {
						 event.preventDefault();
						 return (event.returnValue = "");
					};

					// Informăm utilizatorul.
					cont.innerHTML = `<h3>Se trimite comanda...</h3><progress></progress> <span>0%</span>`;
					let prog = cont.querySelector("progress");
					let progText = cont.querySelector("span");

					// Salvăm datele introduse pentru folosință în viitor.
					//var fields = ["name", "email", "phone", "store", "address"];
					for (var i = 0; i < fields.length; i++) {
						us(fields[i], page.querySelector("#" + fields[i]).value);
					}
					us("isfiz", rf.checked);

					let izf = rf.checked;

					let f1 = izf ? ug("name") : ug("biz");
					let f2 = ug("email");
					let f3 = ug("phone");
					let f4 = izf ? ug("cnp") : ug("cui");
					let f5 = ug("address");
					let f6 = izf ? "" : ug("regcom");

					// Reîmprospătăm lista de produse.
					loadProd();

					// Înlocuim placeholderele din URL cu date reale.
					var url = config.gformURL.replace("FIELD1", f1).replace("FIELD0", "Nu").replace("FIELD2", f2).replace("FIELD3", f3).replace("FIELD4", f4).replace("FIELD5", f5).replace("FIELD6", f6);
				//	url = url.replace("DATA", new Date().toLocaleString("ro"));
					let progValue = 0;
					let maxProg = prods.length + 2;
					function addProgress() {
						progValue++;
						prog.value = progValue;
						prog.max = maxProg;
						progText.innerText = `${Math.floor((progValue / maxProg) * 100)}%`;
					};
					//addProgress();
					// Creem un iframe, iframe-ul 0.
					var ifr0 = document.createElement("iframe");
					// Îi dăm un URL în care placeholderele sunt înlocuite cu date goale. Asta va crea o linie goală în sheet, utilă pentru a se distinge comenzile unele de altele.
					ifr0.src = config.gformURL.replace(/(?: |^)FIELD1|FIELD1|FIELD2|FIELD3|FIELD4|FIELD5(?: |$)/g, "").replace("FIELD0", "-").replace("FIELD6", "").replace("FIELD5", "");
					// Funcție pt. când se încarcă pagina din ifr0 (facem asta pentru ca intrările să apară în sheet în ordine corectă).
					ifr0.addEventListener("load", function() {
					// Actualizăm progresul.
					addProgress();
					// Creem un al doilea iframe, iframe-ul 1;
					var ifr1 = document.createElement("iframe");
					// Îi dăm url-ul populat cu datele introduse (nume, mail, tel, magazin, adresa).
					ifr1.src = url;
					// Când se ancarca si ata..
					ifr1.addEventListener("load", function(){
					orderDate = (new Date()).toLocaleString("ro");
					// Actualizăm progresul.
					addProgress();
					// Pentru a vedea când totul s-a încărcat.
					let loads = [];
					for (let i = 0; i < prods.length; i++) loads[i] = false;
					window.setLoaded = function(z) {
						console.info(z);
						loads[z] = true;
					// Actualizăm progresul.
					addProgress();
						let ok = true;
						for (let i = 0; i < prods.length; i++) {
							console.warn(`${z.toString()} is ${loads[z]}`);
							if (loads[i] != true) {
								ok = false;
								break;
							}
						}
						if (ok) { cont.querySelector("h3").innerHTML = "Comanda a fost trimisă cu succes!"; delete window.setLoaded; window.onbeforeunload = function(){}; };
					}
					// Pentru fiecare produs.
					for (var i = 0; i < prods.length; i++) {
						// Dacă produsul este în cantitate mai mare de 0 (duh).
						if (ug("cart")[prods[i].plu.toString()] > 0) {
						// Creem un URL în care câmpul 0 (starea comenzii) este gol, deoarece starea comenzii se înregistrează în header (trimis de iframe-ul 0), de către agent.
						// Apoi îl populăm cu date despre produs (cantitate, produs, pret, pretunitar, totalcomanda).
						var url2 = config.gformURL.replace("FIELD5", `${t} ${config.currency}`).replace("FIELD0", "-").replace("FIELD1", ug("cart")[prods[i].plu.toString()].toString()).replace("FIELD2", prods[i].name).replace("FIELD3", `${(ug("cart")[prods[i].plu.toString()] * prods[i].price).toString()}%20${config.currency}`).replace("FIELD4", `${prods[i].price} ${config.currency}`).replace("FIELD6", "");
						// Creem un iframe, iframe-ul 2.
						var ifr2 = document.createElement("iframe");
						// Îi dăm url-ul.
						ifr2.src = url2;
						ifr2.addEventListener("load", new Function(`window.setLoaded(${i});`));
						// O adăugăm în container-ul magic, un container ascuns în care stau toate iframe-urile astea, ascunzând procedura noastră de trei lei de utilizatorul final.
						// Chiar m-am ambiționat să fac chestia asta serverless în cel mai prost mod posibil.
						magic.appendChild(ifr2);
						}
					}
					// Inserăm intrarea in istoric.
					let hstcart = ug("cart");
					hstcart.date = orderDate;
					hstcart.total = calcTotal(true).toString();
					let hst = ug("history");
					hst.push(hstcart);
					us("history", hst);
					// Golim coșul.
					us("cart", {});
					//cont.innerHTML = "";
					tot.innerText = `Total: 0 ${config.currency}`;
					});
					// Iară magicu ăla.
					magic.appendChild(ifr1);
					});
					// Și îl aruncăm și pe ifr0 acolo.
					magic.appendChild(ifr0);
					}
				} else {
					// serios? ce vrei de la noi, aer?
					alert("Adăugați ceva în coș înainte de a comanda!");
				}
				});
			
		},
		"underconstruction": function (page) {
			let field = page.querySelector("input");
			let btn = page.querySelector("button");
			btn.addEventListener("click", () => {
				us("constructionPass", field.value);
				window.location.reload();
			});
		}
	}
	
	// Pagina prestabilită
	var defaultPag = "home";

	// 404 notfound
	var notFoundPag = "notfound";

	// ÎN CONSTRUCȚIE //

	// Nu sunt intenționată să fiu securizată, ci doar inaccesibilă utilizatorului de rând!
	let constructionPass = "masimo.candy42";

	// Dacă parola nu este corectă, redirecționăm forțat utilizatorul la pagina de construcție.
	if (ug("constructionPass") != constructionPass) {
		//pag = "underconstruction";
		//defaultPag = "underconstruction";
		//notFoundPag = "underconstruction";
		document.body.querySelector("#pages").classList.add("hidden");
		document.body.querySelector("#underconstruction").classList.remove("hidden");
		document.body.querySelector(".hreal").innerHTML = `<a href="?page=home">Acasă</a>`;
		callbacks["underconstruction"](document.body.querySelector("#underconstruction"));
	}

	// ÎN CONSTRUCȚIE //

	// Creem o listă a paginilor.
	var pages = [];
	var pageEls = document.body.querySelectorAll(".page");
	for (var i = 0; i < pageEls.length; i++) pages.push(pageEls[i].id);

	// Alegem pagina.
	for (var i = 0; i < pageEls.length; i++) pageEls[i].classList.add("hidden");
	if (pages.indexOf(pag) != -1) {
		var page = pageEls[pages.indexOf(pag)];
	} else if (pag != "" && pages.indexOf(pag) == -1) {
		var page = document.body.querySelector("#" + notFoundPag);
	} else if (pag == "") {
		//var page = document.body.querySelector("#" + defaultPag);
		window.location.search = "?page=" + defaultPag;
	}

	// Și o încărcăm.
	page.classList.remove("hidden");
	if (callbacks[pag]) callbacks[pag](page);
	let title = page.querySelector("h1");
	if (title) title = title.innerText;
	if (title) {} else { title = ""; };
	document.title = `${title}${title != "" ? " | " : ""}${config.storename}`;
}

main();

});
