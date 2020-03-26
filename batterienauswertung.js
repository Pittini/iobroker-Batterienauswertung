// Batterieüberwachungsskript Version 1.3 Stand 26.03.2020
//Überwacht Batteriespannungen beliebig vieler Geräte welche das selbe LowLimit haben

//WICHTIG!!!
//Vorraussetzungen: Den Geräten müssen Räume zugewiesen sein, sowie die Funktion "BatterieSpannung" für jeden entsprechenden Batteriespannungs Datenpunkt zugewiesen sein.

//Einstellungen
const praefix = "javascript.0.BatterieUeberwachung."; //Grundpfad für Script DPs
const logging = true; //Logging aktivieren?
const WelcheFunktionVerwenden = "BatterieSpannung"; // Legt fest nach welchem Begriff in Funktionen gesucht wird.
const UseTelegram = false; // Sollen Nachrichten via Telegram gesendet werden?
const UseAlexa = false; // Sollen Nachrichten via Alexa ausgegeben werden?
const AlexaId = ""; // Die Alexa Seriennummer
const UseSay = false; // Sollen Nachrichten via Say ausgegeben werden? Funktion des Authors, sollte bei Anwendern auf false gesetzt werden.
const UseEventLog = false; // Sollen Nachrichten ins Eventlog geschreiben werden? Funktion des Authors, sollte bei Anwendern auf false gesetzt werden.
const UsePopUp = false // Soll PopUp angezeigt werden? Funktion des Authors, sollte bei Anwendern auf false gesetzt werden.

//Ab hier nix mehr ändern

let DpCount = 0; //Zähler für anzulegende Datenpunkte
const States = []; //States Array initialisieren
const Sensor = [] //Sensoren Array initialisieren
let SensorVal = []; //SensorDatenpunkte Werte Array initialisieren
let BatteryMinLimit;
let AllBatterysOk = true;
let LastMessage = "";
let LastMessageSeparator = "<br>";
let NextExpectedLowBatt = "";

let Funktionen = getEnums('functions');
for (let x in Funktionen) {        // loop ueber alle Functions
    let Funktion = Funktionen[x].name;
    if (typeof Funktion == 'object') Funktion = Funktion.de;
    let members = Funktionen[x].members;
    if (Funktion == WelcheFunktionVerwenden) { //Wenn Function ist WelcheFunktionVerwenden (BatterieSpannung)
        for (let y in members) { // Loop über alle WelcheFunktionVerwenden Members
            Sensor[y] = members[y];
            //if (logging) log(Funktion + ': ' + members[y]);
        };
    };
};


//Struktur anlegen in js.0 um Sollwert und Summenergebniss zu speichern
//Datenpunkte anlegen 
States[DpCount] = { id: praefix + "AllBatterysOk", initial: true, forceCreation: false, common: { read: true, write: true, name: "Alle Batterien Ok?", type: "boolean", role: "state", def: false } }; //
DpCount++;
States[DpCount] = { id: praefix + "BatteryMinLimit", initial: 2.6, forceCreation: false, common: { read: true, write: true, name: "Unteres Limit für Warnmeldung", type: "number", role: "value", unit: "V", def: 2.6 } }; //
DpCount++;
States[DpCount] = { id: praefix + "LastMessage", initial: "", forceCreation: false, common: { read: true, write: true, name: "Letzte Warnmeldung", type: "string", role: "state", def: "" } }; //
DpCount++;
States[DpCount] = { id: praefix + "NextExpectedLowBatt", initial: "", forceCreation: false, common: { read: true, write: true, name: "Vorraussichtlich nächste zu wechselnde Batterie", type: "string", role: "state", def: "" } }; //


//Alle States anlegen, Main aufrufen wenn fertig
let numStates = States.length;
States.forEach(function (state) {
    createState(state.id, state.initial, state.forceCreation, state.common, function () {
        numStates--;
        if (numStates === 0) {
            if (logging) log("CreateStates fertig!");
            main();
        };
    });
});

function main() {
    if (logging) log("Reaching main()");

    BatteryMinLimit = getState(praefix + "BatteryMinLimit").val; //Werte vom Script einlesen;
    for (let x = 0; x < Sensor.length; x++) {
        SensorVal[x] = getState(Sensor[x]).val;//Wert vom Sensor einlesen
        //if (logging) log(SensorVal[x]);
    };

    CreateTrigger(); // Trigger erzeugen
    CheckAllBatterys(); // Alle Batteriestände prüfen
    CheckNextLowBatt(); // Batterie mit niedrigster Spannung finden
}

function Meldung(msg) {
    if (UseSay) Say(msg);
    if (UseTelegram) {
        sendTo("telegram.0", "send", {
            text: msg
        });
    };
    if (UseAlexa) {
        if (AlexaId != "") setState("alexa2.0.Echo-Devices." + AlexaId + ".Commands.announcement"/*announcement*/, msg);
    };
    if (logging) log(msg);
    if (UseEventLog) WriteEventLog(msg);
    if (UsePopUp) ShowPopUp(true, msg, "Batterys", "red");
    setState(praefix + "LastMessage", LastMessage); //Meldung in Datenpunkt LastMessage schreiben

}

function CheckNextLowBatt() { //Ermittelt die Batterie mit der geringsten Spannung, ignoriert Batterien welche das Limit bereits unterschritten haben da diese bereits in der LastMessage gemeldet werden
    let LowestBattVal = 100;
    let LowestBattIndex = 0
    for (let x = 0; x < Sensor.length; x++) { //Alle Sensoren durchlaufen
        if (SensorVal[x] > BatteryMinLimit) { // Nur Sensoren berücksichtigen die das min Limit noch nicht unterschritten haben
            if (SensorVal[x] < LowestBattVal) { //Wenn Sensorwert kleiner LowestBattVal, LowestBattVal auf neuen Wert setzen um min Value zu ermitteln
                LowestBattVal = SensorVal[x];
                LowestBattIndex = x;
            };
        };
    };

    NextExpectedLowBatt = "Wartungshinweis: Aktuell niedrigster Batteriestand (" + SensorVal[LowestBattIndex] + "V): " + GetRoom(LowestBattIndex) + " bei Gerät " + getObject(Sensor[LowestBattIndex].substring(0, Sensor[LowestBattIndex].lastIndexOf("."))).common.name
    setState(praefix + "NextExpectedLowBatt", NextExpectedLowBatt);
    log(NextExpectedLowBatt);
}

function CheckAllBatterysOk() {
    AllBatterysOk = true;
    for (let x = 0; x < Sensor.length; x++) { //Alle Sensoren durchlaufen
        if (SensorVal[x] < BatteryMinLimit) { // Nur Sensoren berücksichtigen die das min Limit noch nicht unterschritten haben
            AllBatterysOk = false;
        };
    };
    setState(praefix + "AllBatterysOk", AllBatterysOk);
    if (AllBatterysOk) { 
        LastMessage = ""; //Lastmessage löschen
        setState(praefix + "LastMessage", LastMessage); //Meldung in Datenpunkt LastMessage löschen
        if (logging) log("Alle Batterien ok, Lastmessage gelöscht")
    };
}

function CheckBatterys(x) { // Prüfung eines einzelnen Batteriestandes wenn getriggert
    if (logging) log("Reaching CheckBatterys(x)");
    if (SensorVal[x] < BatteryMinLimit) { //Wenn Min. Wert unterschritten
        LastMessage = "Wartungshinweis: Batteriestand niedrig im " + GetRoom(x) + " bei Gerät " + getObject(Sensor[x].substring(0, Sensor[x].lastIndexOf("."))).common.name;
        Meldung(LastMessage);
    };
    CheckAllBatterysOk();
    CheckNextLowBatt();
}

function CheckAllBatterys() { // Prüfung alle Batteriestände bei Skriptstart
    if (logging) log("Reaching CheckAllBatterys() Sensor.length = " + Sensor.length);
    //LastMessage = ""
    for (let x = 0; x < Sensor.length; x++) { //Alle Sensoren durchlaufen
        if (SensorVal[x] < BatteryMinLimit) { //Wenn Min. Wert unterschritten
            if (logging) log("SensorVal[" + x + "] = " + SensorVal[x] + "V, unterschreitet MinLinmit von " + BatteryMinLimit + " V");
            //setTimeout(function () { //TimeOut damit die Meldung nachkommt wenn mehrere, ohne wird nur der erste angezeigt weil zu schnell
            LastMessage = LastMessage + "Wartungshinweis: Batteriestand niedrig in " + GetRoom(x) + " bei Gerät " + getObject(Sensor[x].substring(0, Sensor[x].lastIndexOf("."))).common.name + LastMessageSeparator;
            //}, 100 * x); //Wert der Schleife mit 100 multiplizieren damit bei jedem Durchlauf der Wert um 100ms erhöht wird
        };
    };
    CheckAllBatterysOk()
    LastMessage = LastMessage.substr(0, LastMessage.length - LastMessageSeparator.length); //letzten <br> Umbruch wieder entfernen
    if (LastMessage != "") Meldung(LastMessage); // Wenn Lastmessage nicht leer, Nachricht ausgeben
}

function GetRoom(x) {  // Raum eines Gerätes ermitteln
    let room = getObject(Sensor[x], 'rooms').enumNames[0];
    if (typeof room == 'object') room = room.de;
    return room;
};

//Trigger für Sensoren erzeugen
function CreateTrigger() {
    for (let x = 0; x < Sensor.length; x++) { //Alle Sensoren durchlaufen
        on(Sensor[x], function (dp) { //Trigger in Schleife erstellen
            SensorVal[x] = dp.state.val;
            CheckBatterys(x);
        });
    };

    on(praefix + "BatteryMinLimit", function (dp) { //Trigger erstellen und auslösen wenn min Limit geändert wurde. Dann erneute Komplettprüfung aller Batteriestände
        BatteryMinLimit = dp.state.val;
        CheckAllBatterys();
    });
}

