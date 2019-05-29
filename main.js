const {app, BrowserWindow, ipcMain} = require('electron')
const {ipcRenderer} = require('electron');
const path = require('path')
const url = require('url')
const log = require('electron-log');
const {autoUpdater} = require("electron-updater");
const {dialog} = require('electron')

let win
let sobreWindow = null;

const appReadyEvent = () => {
	CriarTela();
	autoUpdater.checkForUpdatesAndNotify();
}

function sendStatusToWindow(text) {
	win.webContents.send('message', text, app.getVersion());
}

function Atualizacao() {
	win.loadURL(
		url.format({
			pathname: path.join('produtor.ingressonacional.local/atualizacao.html'),
			protocol: 'http:'
		})
	)
	return win;
}

function CriarTela() {
	win = new BrowserWindow();
	win.maximize();
	win.show();
	win.webContents.openDevTools();
	win.on('closed', () => {
		win = null;
	});
	// win.loadURL(
	// 	url.format({
	// 		pathname: path.join('produtor.ingressonacional.local/aguarde.html'),
	// 		protocol: 'http:'
	// 	})
	// )
	win.loadURL(
		url.format({
			pathname: path.join('produtor.ingressonacional.local/'),
			protocol: 'http:'
		})
	)
	return win;
}

function AbrirSistema () {
	win.loadURL(
		url.format({
			pathname: path.join('produtor.ingressonacional.local/'),
			protocol: 'http:'
		})
	)
}

app.on('ready', appReadyEvent);

app.on('window-all-closed', () => {
  app.quit();
});

autoUpdater.on('update-available', (info) => {
	Atualizacao();
})

autoUpdater.on('update-not-available', (info) => {
	AbrirSistema();
})

autoUpdater.on('download-progress', (progressObj) => {
	sendStatusToWindow(progressObj.percent);
})

autoUpdater.on('update-downloaded', (info) => {
	autoUpdater.quitAndInstall();  
});

ipcMain.on('verificaVersao', (event) =>{
	event.sender.send('retornoVerificaVersao', 'nova');
});

ipcMain.on('imprimir', (event) =>{
	win.webContents.print({silent: true, deviceName: 'INacional'});
});

ipcMain.on('imprimirIngressos', (event, item, contador) =>{
	let impressora = {'status': 999};
	var contadorVerificacao = 0;
	while(impressora.status != 0 && contadorVerificacao < 10){
		let retornoImpressora = win.webContents.getPrinters();
		contadorVerificacao++;
		for (var i = 0; i < retornoImpressora.length; i++) {
			if(retornoImpressora[i].name == item.ModImpressora){
				impressora = retornoImpressora[i];
			}
		}
	}
	if(impressora.status == 0){
		win.webContents.print({silent: true, deviceName: item.ModImpressora}, function (success) {
			if(success){
				if(item){
					if(item.IngressoImpresso == 'N'){
						item.IngressoImpresso = 'S';
					} else if(item.IngressoImpresso == 'S' && item.reciboImpresso == 'N'){
						item.reciboImpresso = 'S';
					}
				}
				var anterior = contador;
				contador++;
				event.sender.send('retornoImpressaoSucesso', item, anterior, contador);
			} else {
				event.sender.send('retornoImpressaoErro', item);
			}
		});
	} else if(impressora.status == 999){
		event.sender.send('retornoSemImpressora');
	} else {
		event.sender.send('retornoImpressoraErro');
	}
});


ipcMain.on('imprimirComprovante', (event) =>{
	let impressora = {'status': 999};
	var contadorVerificacao = 0;
	while(impressora.status != 0 && contadorVerificacao < 10){
		let retornoImpressora = win.webContents.getPrinters();
		contadorVerificacao++;
		for (var i = 0; i < retornoImpressora.length; i++) {
			if(retornoImpressora[i].name == 'INacional'){
				impressora = retornoImpressora[i];
			}
		}
	}
	if(impressora.status == 0){
		win.webContents.print({silent: true, deviceName: 'INacional'}, function (success) {
			if(success){
				event.sender.send('retornoImpressaoComprovanteSucesso');
			} else {
				event.sender.send('retornoImpressaoErro', item);
			}
		});
	} else if(impressora.status == 999){
		event.sender.send('retornoSemImpressora');
	} else {
		event.sender.send('retornoImpressoraErro', 'comprovante');
	}
});