const Version = "1.7.0"; // Batterieüberwachungsskript Stand 09.01.2021 - Git: https://github.com/Pittini/iobroker-Batterienauswertung - Forum: https://forum.iobroker.net/topic/31676/vorlage-generische-batteriestandsüberwachung-vis-ausgabe
//Überwacht Batteriespannungen beliebig vieler Geräte 
log("starting Batterieüberwachung V." + Version);
//WICHTIG!!!
//Vorraussetzungen: Den Gerätechannels müssen Räume, sowie die Funktion "BatterieSpannung_xx" für jeden entsprechenden Batteriespannungs Datenpunkt zugewiesen sein.
//Bitte unbedingt Anleitung beachten
// Nach der Zuweisung unbedingt den JS Adpter neu starten!

//Grund Einstellungen
const praefix = "javascript.0.BatterieUeberwachung."; //Grundpfad für Script DPs
const logging = true; //Logging aktivieren?
const FunktionBaseName = "BatterieSpannung_"; //Name der Funktion welche für die Batterieüberwachung genutzt wird
const DeadFunktionName = "DeadCheck"; //Name der Funktion welche für die Batterieüberwachung genutzt wird
const UseTelegram = false; // Sollen Nachrichten via Telegram gesendet werden?
const UseMail = false; // Sollen Nachrichten via Mail gesendet werden?
const UseAlexa = false; // Sollen Nachrichten via Alexa ausgegeben werden?
const AlexaId = ""; // Die Alexa Seriennummer
const UseSay = false; // Sollen Nachrichten via Say ausgegeben werden? Funktion des Authors, sollte bei Anwendern auf false gesetzt werden.
const UseEventLog = false; // Sollen Nachrichten ins Eventlog geschreiben werden? Funktion des Authors, sollte bei Anwendern auf false gesetzt werden.
const UsePopUp = false // Soll PopUp angezeigt werden? Funktion des Authors, sollte bei Anwendern auf false gesetzt werden.
const ProzMeansLive = true; //Zeigen Prozentwerte des Gerätedatenpunktes Batteriekapazität oder restliche Lebensdauer?
let DeadIsAfter = 360; // In Minuten - Zeit nach der ein Gerät als "tot" gewertet wird wenn keine Statusänderung (ts) erfolgte.
const NotifyDeadDevices = true; //Sollen auch "tote" Geräte gemeldet werden?
const DeconzNameFromDP=false; //Nimmt für Deconz den Namen aus dem Datenpunkt statt aus dem übergeordnetem Channel

//Tabellen Einstellungen
const TblOkBgColor = "#4caf50"; //Hintergrundfarbe für Batteriestatus Ok
const TblInfoBgColor = "#ffc107"; //Hintergrundfarbe für Batteriestatus Info, also die leerste Batterie welche noch nicht das Limit unterschreitet
const TblWarnBgColor = "#f44336"; //Hintergrundfarbe für Batteriestatus Warnung, also jene Batterie welche unter das Limit kam.
const TblDeadBgColor = "grey"; //Hintergrundfarbe für Batterie/Geräte Status tot.
const HeadBgColor = "dimgrey"; //Hintergrundfarbe des Tabellenkopfes
const FontColor = "black"; //Textfarbe für Tabelleninhalt
const HeadFontColor = "white"; //Textfarbe für Tabellenkopf
const TblShowLfdCol = true; //Tabellenspalte mit laufender Nummer anzeigen?
const TblShowDeviceIDCol = true; //Tabellenspalte mit Geräte ID anzeigen?
const TblShowDeviceNameCol = true; //Tabellenspalte mit Gerätenamen anzeigen?
const TblShowRoomCol = true; //Tabellenspalte mit Raum anzeigen?
const TblShowUmaxCol = true; //Tabellenspalte mit Batterie Nennspannung anzeigen? 
const TblShowUistCol = true; //Tabellenspalte mit aktueller Batteriespannung anzeigen?
const TblShowUlimitCol = true; //Tabellenspalte mit unterer Batterielimit Spannung anzeigen?
const TblShowProzbatCol = true; //Tabellenspalte mit Batteriestand in Prozent anzeigen?
const TblShowProzliveCol = true; //Tabellenspalte mit Restlebensdauer unter Berücksichtigung der Limitspannung in Prozent anzeigen? Beispiel: Batterie hat 3V Nennspannung, Limit ist bei 2V, aktueller Batteriestand ist 2.5V, dann wäre die Restlebensdauer 50%
const TblShowStatusCol = true; //Tabellenspalte mit Status ausgeben?

//Ab hier nix mehr ändern
/** @type {{ id: string, initial: any, forceCreation: boolean, common: iobJS.StateCommon }[]} */
const States = []; //States Array initialisieren
let DpCount = 0; //Zähler für anzulegende Datenpunkte
const Sensor = [] //Sensoren Array initialisieren
const SensorVal = []; //SensorDatenpunkte Werte Array initialisieren
const SensorUmax = []; //Sensoren Array Batteriespannungswerte Werte initialisieren
const SensorUProz = []; //Sensoren Array Spannung in Prozent initialisieren
const SensorLiveProz = []; //Sensoren Array verbleibende Lebendauer unter Berücksichtigung des min Limits, nicht zu verwechseln mit Batteriekapazität in %
const SensorState = []; //Statusarray, mögliche Werte ok,info,warn,dead
const BatteryMinLimit = []; // Das eingestellte Batterie min. limit
const BatteryMinLimitDp = []; //Array mit den generierten MinLimit Einstellungsdatenpunkten
const WelcheFunktionVerwenden = []; // Array mit allen Einträgen aus Funktionen welche den FunktionBaseName beinhalten
let AllBatterysOk = true;
let LastMessage = "";
let LastMessageSeparator = "<br>";
let NextExpectedLowBatt = "";
let EmptyBatCount = 0;
let DeadDeviceCount = 0;

//Datenpunkte anlegen in javascript.0.BatterieUeberwachung.
States[DpCount] = { id: praefix + "AllBatterysOk", initial: true, forceCreation: false, common: { read: true, write: false, name: "Alle Batterien Ok?", type: "boolean", role: "state", def: false } }; //
DpCount++;
States[DpCount] = { id: praefix + "LastMessage", initial: "", forceCreation: false, common: { read: true, write: false, name: "Letzte Warnmeldung", type: "string", role: "state", def: "" } }; //
DpCount++;
FillWelcheFunktionVerwenden(); //Vorab Funktionen mit Umax Spannungen einlesen da diese für ID und Namen der MinLimit States benötigt werden

for (let x = 0; x < WelcheFunktionVerwenden.length; x++) {
    let dummy = WelcheFunktionVerwenden[x].slice(FunktionBaseName.length) //Letzten Zeichen aus Funktionsnamen extrahieren
    let VoltInitial = CreateUmaxValueFromString(x) //Extrahierte Zeichen zu Kommazahl wandeln 
    VoltInitial = VoltInitial / 100 * 80; //Initialwert für Limit berechnen
    if (logging) log("InitialSpannung " + x + " gesetzt auf 80%= " + VoltInitial);
    States[DpCount] = { id: praefix + "BatteryMinLimit_" + dummy, initial: VoltInitial, forceCreation: false, common: { read: true, write: true, name: "Unteres Limit für Warnmeldung bei " + toFloat(dummy.slice(0, dummy.length - 1) + "." + dummy.slice(-1)) + "V Geräten", type: "number", role: "value", unit: "V", def: 2.6 } }; //
    BatteryMinLimitDp[x] = "BatteryMinLimit_" + dummy;
    DpCount++;
};
States[DpCount] = { id: praefix + "NextExpectedLowBatt", initial: "", forceCreation: false, common: { read: true, write: false, name: "Vorraussichtlich nächste zu wechselnde Batterie", type: "string", role: "state", def: "" } }; //
DpCount++;
States[DpCount] = { id: praefix + "OverviewTable", initial: "", forceCreation: false, common: { read: true, write: false, name: "Einfache HTML Übersichtstabelle", type: "string", role: "state", def: "" } }; //
DpCount++;
States[DpCount] = { id: praefix + "EmptyBatCount", initial: 0, forceCreation: false, common: { read: true, write: false, name: "Zähler für Anzahl der zu wechselnden Batterien", type: "number", role: "state", def: 0 } }; //
DpCount++;
States[DpCount] = { id: praefix + "DeadDeviceCount", initial: 0, forceCreation: false, common: { read: true, write: false, name: "Zähler für Anzahl der nicht mehr aktualisierenden Geräte", type: "number", role: "state", def: 0 } }; //

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

function CreateUmaxValueFromString(x) {
    let dummy = WelcheFunktionVerwenden[x].slice(FunktionBaseName.length) //Aus der Funktionsbezeichnung die letzten Zeichen extrahieren= z.B. 33
    return toFloat(dummy.slice(0, dummy.length - 1) + "." + dummy.slice(-1)) //Die extrahierten Zeichen zu einer Kommazahl wandeln= z.B. 3.3
}

function Init() {
    if (logging) log("Reaching init()");
    let counter = 0; //Zähler für Devices
    let TempVal // Temporärer Sensorwert um nicht mehrere GetStates zu benötigen
    let TempUnit //Einheit für Unterscheidung ob % vorliegen
    let TempLiveWindow //Spannungsfensterbereich
    let Funktionen = getEnums('functions'); //Alle Funktionen der Aufzählung in Array Funktionen übertragen
    for (let x in Funktionen) {        // loop ueber alle Funktionen
        let Funktion = Funktionen[x].name; // Einzelne Funktion aus dem Array
        if (typeof Funktion == 'object') Funktion = Funktion.de; //Wenn Rückgabewert ein Objekt ist, ist die Funktion mehrsprachig und es wird die deutsche Bezeichnug verwendet
        let members = Funktionen[x].members; //Array mit allen Mitgliedern der Funktion erzeugen
        for (let z = 0; z < WelcheFunktionVerwenden.length; z++) { //Loop über alle Funktions welche zu WelcheFunktionVerwenden passen
            if (Funktion == WelcheFunktionVerwenden[z]) { //Wenn Function ist WelcheFunktionVerwenden (BatterieSpannung)
                let Umax = CreateUmaxValueFromString(z) //Batteriesollspannung aus der Funktionsbezeichnung extrahieren
                let BattMinLimitTemp = getState(praefix + "BatteryMinLimit_" + WelcheFunktionVerwenden[z].slice(FunktionBaseName.length)).val; //Temporäres (für den jeweiligen Schleifendurchlauf) MinLimit einlesen
                if (typeof (BattMinLimitTemp == "string")) { //Falls MinLimit Wert String ist zu float wandeln
                    //log("BattMinLimit Value is String, trying to convert");
                    BattMinLimitTemp = parseFloat(BattMinLimitTemp);
                    if (typeof (BattMinLimitTemp == "number")) {
                        if (logging) log("BattMinLimit Value conversion - success");
                    };
                };
                let TempLiveWindow = Umax - BattMinLimitTemp;
                for (let y in members) { // Loop über alle WelcheFunktionVerwenden Members
                    Sensor[counter] = members[y]; //Treffer in SenorIDarray einlesen
                    TempVal = getState(Sensor[counter]).val;//Wert vom Sensor in Tempval einlesen um wiederholte Getstates zu vermeiden
                    // if (typeof (TempVal) == undefined || typeof (TempVal) == null || TempVal == "") TempVal = 0; //Bei leeren Feldern 0 setzen um Fehler zu vermeiden
                    if (logging) log("existsState(Sensor[counter])=" + existsState(Sensor[counter]) + " typeof (getState(Sensor[counter]).val)=" + typeof (getState(Sensor[counter]).val) + " getState(Sensor[counter]).val=" + getState(Sensor[counter]).val)

                    TempUnit = GetUnit(counter);
                    if (logging) log("Tempval=" + TempVal + " TempUnit=" + TempUnit + " TypeOf=" + typeof (TempVal))
                    switch (typeof (TempVal)) { //Wenn der Sensorwert bool ist (wenn nur LowBatt mit true/false vom Sensor gemeldet wird)
                        case "boolean": //Sensorval ist Bool
                            if (TempVal) { //Bei Lowbat=true
                                SensorVal[counter] = 0; //Batt wird als leer definiert und auf 0 gesetzt
                                SensorUProz[counter] = 0; //Prozentwerte aus Umax und Sensorwert errechnen
                                SensorLiveProz[counter] = 0; //Lebensprozent auf 0%
                            }
                            else {
                                SensorVal[counter] = Umax; //Batt wird als voll definiert und auf Umax gesetzt
                                SensorUProz[counter] = 100; //Prozentwerte aus Umax und Sensorwert errechnen
                                SensorLiveProz[counter] = 100; //Lebensprozent auf 100%
                            };
                            break;
                        case "number": //Sensorval ist Zahl
                            switch (TempUnit) { //Bei Zahlen nach Einheit unterscheiden um % Angaben mit zu verarbeiten
                                case "%": //Bei Datenpunkt Unit = %
                                    //if (logging) log("unit= " + TempUnit + " should be %");
                                    if (ProzMeansLive) { // Wenn die Prozentangabe bereits Lebensdauer zeigt (Einstellungsoption)
                                        SensorLiveProz[counter] = TempVal; //Direkt zuweisen aus Sensorwert
                                        //SensorUProz[counter] = (Umax - (TempLiveWindow / 100 * SensorLiveProz[counter])) / Umax * 100 //Errechne Batteriekapazität
                                        //SensorVal[counter] = Umax / 100 * SensorUProz[counter];  //Errechne Spannung
                                        SensorVal[counter] = Umax - TempLiveWindow + (TempLiveWindow / 100 * SensorLiveProz[counter]);
                                        SensorUProz[counter] = (SensorVal[counter] / Umax) * 100 //Errechne Batteriekapazität
                                    }
                                    else if (!ProzMeansLive) { //Wenn die Prozentangabe Batteriekapazität darstellt  (Einstellungsoption)
                                        SensorUProz[counter] = TempVal; //Batteriekapazität in % bestimmen
                                        SensorVal[counter] = Umax / 100 * SensorUProz[counter]; //Sensorwert aus Umax und Prozentwert bestimmen
                                        SensorLiveProz[counter] = (SensorVal[counter] - BattMinLimitTemp) / (Umax - BattMinLimitTemp) * 100; //Restlebensdauer in % ermitteln
                                    };

                                    break;
                                default: // In allen anderen Fällen
                                    SensorVal[counter] = TempVal; //Spannung ist Wert vom DP
                                    SensorUProz[counter] = SensorVal[counter] / Umax * 100; //Prozentwerte aus Umax und Sensorwert errechnen
                                    SensorLiveProz[counter] = (SensorVal[counter] - BattMinLimitTemp) / (Umax - BattMinLimitTemp) * 100; //Restlebensdauer in % ermitteln
                            };
                            break;
                        case "string": //Sensorval ist Text
                            if (TempVal == "ok") {
                                SensorVal[counter] = Umax; //Batt wird als voll definiert und auf Umax gesetzt
                                SensorUProz[counter] = 100; //Prozentwerte aus Umax und Sensorwert errechnen
                                SensorLiveProz[counter] = 100; //Lebensprozent auf 100%
                            }
                            else if (TempVal != "ok") { //Bei BatteryState != ok
                                SensorVal[counter] = 0; //Batt wird als leer definiert und 0.1 unter MinLimit gesetzt
                                SensorUProz[counter] = 0; //Prozentwerte aus Umax und Sensorwert errechnen
                                SensorLiveProz[counter] = 0; //Lebensprozent auf 0%
                            };
                            break;
                        default:
                    };
                    if (SensorLiveProz[counter] > 100) SensorLiveProz[counter] = 100; //Um bei übervollen Batterien mehr als 100% live zu vermeiden
                    SensorUmax[counter] = Umax; //Synchrones UmaxArray füllen
                    BatteryMinLimit[counter] = BattMinLimitTemp; //Limitarray füllen
                    if (logging) log(counter + " " + Funktion + ' found at ' + members[y] + " Umax= " + SensorUmax[counter] + " BattMinLimit=" + BattMinLimitTemp + " Val= " + SensorVal[counter] + " SensorProzent= " + SensorUProz[counter]);
                    counter++
                };
            };
        };
    };
}

function FillWelcheFunktionVerwenden() {
    if (logging) log("Reaching FillWelcheFunktionVerwenden");
    let z = 0;
    let Funktionen = getEnums('functions'); //Alle Funktionen der Aufzählung in Array Funktionen übertragen
    //let NumFunktionen = Funktionen.length
    for (let x in Funktionen) {        // loop ueber alle Funktionen
        let Funktion = Funktionen[x].name; // Einzelne Funktion aus dem Array
        if (typeof Funktion == 'object') Funktion = Funktion.de; //Wenn Rückgabewert ein Objekt ist, ist die Funktion mehrsprachig und es wird die deutsche Bezeichnung verwendet
        let members = Funktionen[x].members; //Array mit allen Mitgliedern der Funktion erzeugen
        if (Funktion.includes(FunktionBaseName)) {
            WelcheFunktionVerwenden[z] = Funktion;
            if (logging) log("Found Function " + WelcheFunktionVerwenden[z])
            z++
        };
    };
}

function main() {
    if (logging) log("Reaching main()");
    Init(); //Alle Werte einlesen, Arrays füllen, fehlende Werte errechnen
    CreateTrigger(); // Trigger erzeugen
    CheckDeadBatt(); //Auf nicht mehr aktualisierende Geräte seit Zeit x (Einstellung) prüfen
    CheckAllBatterys(); // Alle Batteriestände prüfen
    CheckAllBatterysOk();
    CheckNextLowBatt(); // Batterie mit niedrigster Spannung finden
    MakeTable(); //HTML Tabelle erzeugen
    Ticker(); //Startet Intervallprüfung für nicht aktualisierende Geräte
}

function Meldung(msg) {
    if (logging) log("Reaching Meldung()");
    if (UseSay) Say(msg);
    if (UseTelegram) {
        sendTo("telegram.0", "send", {
            text: msg
        });
    };
    if (UseMail) {
        sendTo("email", {
            html: msg
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

function CheckDeadBatt() {
    if (logging) log("Reaching CheckDeadBatt()");
    let jetzt = new Date().getTime();
    let Funktionen = getEnums('functions'); //Alle Funktionen der Aufzählung in Array Funktionen übertragen
    let IsDead = false;
    DeadDeviceCount = 0;
    let members
    for (let y in Funktionen) {        // loop ueber alle Funktionen
        let Funktion = Funktionen[y].name; // Einzelne Funktion aus dem Array
        if (typeof Funktion == 'object') Funktion = Funktion.de; //Wenn Rückgabewert ein Objekt ist, ist die Funktion mehrsprachig und es wird die deutsche Bezeichnung verwendet
        if (Funktion.includes(DeadFunktionName)) {
            members = Funktionen[y].members; //Array mit allen Mitgliedern der Funktion erzeugen
        };
    };


    for (let x = 0; x < Sensor.length; x++) { //Alle Sensoren durchlaufen
        if (existsState(Sensor[x])) {
            if ((getState(Sensor[x]).ts + (DeadIsAfter * 60 * 1000)) < jetzt) { //Wenn letzte Aktualisierung + Karrenzzeit kleiner aktuelle Zeit = Sensor möglicher weise tot, 2te Prüfung einleiten

                let ParentDeviceId = GetParentId(Sensor[x]);
                let SecCheckFound = false;
                if (logging) log("Device " + ParentDeviceId + " is possibly dead, searching for second check");

                for (let z in members) {
                    if (!SecCheckFound) {
                        if (members[z].includes(ParentDeviceId)) {    //Jetzt prüfen ob weitere Funktion DeadCheck innerhalb des Channels

                            SecCheckFound = true;
                            if (logging) log("Device " + ParentDeviceId + " has second check, now checking");
                            if (logging) log("z=" + z + " Device " + ParentDeviceId + " second check at  " + members[z]);
                            if ((getState(members[z]).ts + (DeadIsAfter * 60 * 1000)) < jetzt) {
                                if (logging) log(ParentDeviceId + " seems to be really dead");
                                IsDead = true;
                            } else {
                                if (logging) log(ParentDeviceId + " is not dead at second checkpoint");
                                IsDead = false;
                            };
                        } else {
                            IsDead = true;
                        };
                    };
                };
                if (logging && !SecCheckFound) log("No second checkpoint found for " + ParentDeviceId + " so its really dead");

                if (IsDead) {
                    if (logging) log("Jim...he's dead")
                    if (SensorState[x] != "dead") { //Wenn Sensor bei letzter Prüfung noch nicht tot.
                        if (NotifyDeadDevices) {
                            Meldung("Ausfall oder disconnect im " + GetRoom(x) + " bei Gerät " + getObject(ParentDeviceId).common.name);
                        };
                    };
                    SensorState[x] = "dead"; //Status auf tot setzen
                    DeadDeviceCount++; //Zähler ehöhen
                };
            }
            else if (SensorState[x] == "dead") { //Wenn Sensor als tot gelistet, aber wieder aktualisiert, Status prüfen
                CheckBatterys(x);
            };
        } else {
            log("CheckDeadBatt() State for " + x + " doesnt exists");
        };
    };
    setState(praefix + "DeadDeviceCount", DeadDeviceCount);
    MakeTable();
}

function Ticker() {
    setInterval(function () { // Wenn 
        CheckDeadBatt();
    }, 60000);
}


function CheckNextLowBatt() { //Ermittelt die Batterie mit der geringsten Spannung, ignoriert Batterien welche das Limit bereits unterschritten haben da diese bereits in der LastMessage gemeldet werden
    if (logging) log("Reaching CheckNextLowBatt()");

    let LowestBattProz = 100; //Mit 100% initialisieren
    let LowestBattIndex = 0;
    for (let x = 0; x < Sensor.length; x++) { //Alle Sensoren durchlaufen
        if (SensorState[x] != "warn" && SensorState[x] != "dead") SensorState[x] = "ok";
        if (SensorVal[x] > BatteryMinLimit[x]) { // Nur Sensoren berücksichtigen die das min Limit noch nicht unterschritten haben
            if (SensorLiveProz[x] < LowestBattProz) { //Wenn Sensorwert kleiner LowestBattProz, LowestBattVal auf neuen Wert setzen um das Gerät mit den wenigsten Prozent zu ermitteln
                LowestBattProz = SensorLiveProz[x];
                LowestBattIndex = x;
            };
        };
    };

    NextExpectedLowBatt = "Aktuell niedrigster Batteriestand (" + SensorVal[LowestBattIndex].toFixed(2) + "V): " + GetRoom(LowestBattIndex) + " bei Gerät " + getObject(GetParentId(Sensor[LowestBattIndex]), "common").common.name;
    setState(praefix + "NextExpectedLowBatt", NextExpectedLowBatt);
    SensorState[LowestBattIndex] = "info";
    if (logging) log(NextExpectedLowBatt);
}

function CheckAllBatterysOk() {
    if (logging) log("Reaching CheckAllBatterysOk - Lastmessage=" + LastMessage);
    AllBatterysOk = true;
    EmptyBatCount = 0;
    for (let x = 0; x < Sensor.length; x++) { //Alle Sensoren durchlaufen
        if (SensorVal[x] < BatteryMinLimit[x]) { // Nur Sensoren berücksichtigen die das min Limit unterschritten haben
            //log(Sensor[x]);
            AllBatterysOk = false;
            EmptyBatCount++; //Alle Sensoren zählen welche das Batt min Limit unterschritten haben
        };
    };

    if (DeadDeviceCount > 0) AllBatterysOk = false;

    setState(praefix + "EmptyBatCount", EmptyBatCount);
    setState(praefix + "AllBatterysOk", AllBatterysOk);
    if (EmptyBatCount == 0 && DeadDeviceCount == 0) {
        LastMessage = ""; //Lastmessage löschen
        setState(praefix + "LastMessage", LastMessage); //Meldung in Datenpunkt LastMessage löschen
        if (logging) log("Alle Batterien ok, Lastmessage gelöscht");
    };
}

function CheckBatterys(x) { // Prüfung eines einzelnen Batteriestandes wenn getriggert
    if (logging) log("Reaching CheckBatterys(" + x + ") Val=" + SensorVal[x] + " Limit=" + BatteryMinLimit[x]);
    if (SensorVal[x] < BatteryMinLimit[x]) { //Wenn Min. Wert unterschritten
        //LastMessage = "Batteriestand unter Limit im " + GetRoom(x) + " bei Gerät " + getObject(Sensor[x].substring(0, Sensor[x].lastIndexOf("."))).common.name;
        LastMessage = "Batteriestand unter Limit im " + GetRoom(x) + " bei Gerät " + getObject(GetParentId(Sensor[x])).common.name;

        Meldung(LastMessage);
        SensorState[x] = "warn";
    }
    else {
        SensorState[x] = "ok";
    };
    CheckAllBatterysOk();
    CheckNextLowBatt();
    CheckDeadBatt();
    MakeTable();
}

function CheckAllBatterys() { // Prüfung aller Batteriestände bei Skriptstart
    if (logging) log("Reaching CheckAllBatterys() found " + (Sensor.length) + " Devices");
    for (let x = 0; x < Sensor.length; x++) { //Alle Sensoren durchlaufen
        if (SensorState[x] == "dead") {
            if (logging) log("Sensor[" + x + "] = ist ausgefallen oder disconnected");
            LastMessage += "Ausfall oder disconnect im " + GetRoom(x) + " bei Gerät " + getObject(GetParentId(Sensor[x])).common.name + LastMessageSeparator;
        }
        else if (SensorVal[x] < BatteryMinLimit[x]) { //Wenn Min. Wert unterschritten
            if (logging) log("SensorVal[" + x + "] = " + SensorVal[x] + "V, unterschreitet MinLimit von " + BatteryMinLimit[x] + " V");
            LastMessage += "Batteriestand unter Limit im " + GetRoom(x) + " bei Gerät " + getObject(GetParentId(Sensor[x])).common.name + LastMessageSeparator;

            SensorState[x] = "warn";
        }
        else {
            if (SensorState[x] != "info" && SensorState[x] != "dead") SensorState[x] = "ok";
        };
    };
    //CheckAllBatterysOk();
    //log("Lastmessage=" + LastMessage);
    LastMessage = LastMessage.substr(0, LastMessage.length - LastMessageSeparator.length); //letzten <br> Umbruch wieder entfernen
    if (LastMessage != "") Meldung(LastMessage); // Wenn Lastmessage nicht leer, Nachricht ausgeben
}

function GetRoom(x) {  // Raum eines Gerätes ermitteln
    let room = getObject(Sensor[x], 'rooms').enumNames[0];
    if (room == undefined) room = "Nicht zugewiesen";
    if (typeof room == 'object') room = room.de;
    room = room.replace(/_/g, " "); //Unterstriche durch Leerzeichen ersetzen
    return room;
}

function GetUnit(x) {
    let unit = getObject(Sensor[x], 'common').common.unit
    return unit;
}

function GetParentId(Id) {
    let parentDevicelId;
    if (Id.indexOf("deconz.") > -1 || Id.indexOf("hm-rpc.") > -1 || Id.indexOf("shelly.") > -1) { //Wenn deconz, hm-rpc oder shelly dann zwei Ebenen zurück
        parentDevicelId = Id.split(".").slice(0, -2).join(".");// Id an den Punkten in Array schreiben (split), die 2 letzten Elemente von hinten entfernen (slice) und den Rest wieder zu String zusammensetzen
    }
    else if (Id.indexOf("hmip.") > -1) { //Wenn HMIP dann drei Ebenen zurück
        parentDevicelId = Id.split(".").slice(0, -3).join(".");// Id an den Punkten in Array schreiben (split), die 3 letzten Elemente von hinten entfernen (slice) und den Rest wieder zu String zusammensetzen
    }
    else { //Wenn kein deconz, kein HM und kein shelly Adapter, eine Ebene zurück
        parentDevicelId = Id.split(".").slice(0, -1).join(".");// Id an den Punkten in Array schreiben (split), das letzte Element von hinten entfernen (slice) und den Rest wieder zu String zusammensetzen
    };
    if (DeconzNameFromDP && Id.indexOf("deconz.") > -1) parentDevicelId = Id;
    //if (logging) log("Id= " + Id + " ParentDeviceId= " + parentDevicelId)
    return parentDevicelId;
}

function MakeTable() {
    if (logging) log("Reaching MakeTable");
    let BgColor = "";
    let style0 = "style='border: 1px solid black; padding-left: 5px; padding-right: 5px; font-size:0.8em; font-weight: normal; text-align: left; color:" + FontColor + "; background-color:"
    let style1 = "style='width: 40px; border: 1px solid black; padding-left: 5px; padding-right: 5px; font-size:0.8em; font-weight: normal; text-align: right; color:" + FontColor + "; background-color:"
    let headstyle0 = "style='border: 1px solid black; padding-left: 5px; padding-right: 5px; height: 30px; font-size:1.0em; font-weight: bold; text-align: left; color:" + HeadFontColor + "; background-color:"
    let headstyle1 = "style='width: 40px; border: 1px solid black; padding-left: 5px; padding-right: 5px; height: 30px; font-size:1.0em; font-weight: bold; text-align: center; color:" + HeadFontColor + "; background-color:"

    let MyTableHead = "<table style='width:100%; border: 1px solid black; border-collapse: collapse;'><tr>";
    let MyTable;

    if (TblShowLfdCol) {
        MyTableHead = MyTableHead + "<th " + headstyle0 + HeadBgColor + "'>lfd</th>";
    };
    if (TblShowDeviceIDCol) {
        MyTableHead = MyTableHead + "<th " + headstyle0 + HeadBgColor + "'>Sensor ID</th>";
    };
    if (TblShowDeviceNameCol) {
        MyTableHead = MyTableHead + "<th " + headstyle0 + HeadBgColor + "'>Sensor Name</th>";
    };
    if (TblShowRoomCol) {
        MyTableHead = MyTableHead + "<th " + headstyle0 + HeadBgColor + "'>Raum</th>";
    };
    if (TblShowUmaxCol) {
        MyTableHead = MyTableHead + "<th " + headstyle1 + HeadBgColor + "'>U<br>Nenn</th>";
    };
    if (TblShowUistCol) {
        MyTableHead = MyTableHead + "<th " + headstyle1 + HeadBgColor + "'>U<br>Ist</th>";
    };
    if (TblShowUlimitCol) {
        MyTableHead = MyTableHead + "<th " + headstyle1 + HeadBgColor + "'>U<br>Limit</th>";
    };
    if (TblShowProzbatCol) {
        MyTableHead = MyTableHead + "<th " + headstyle1 + HeadBgColor + "'>%bat</th>";
    };
    if (TblShowProzliveCol) {
        MyTableHead = MyTableHead + "<th " + headstyle1 + HeadBgColor + "'>%live</th>";
    };
    if (TblShowStatusCol) {
        MyTableHead = MyTableHead + "<th " + headstyle1 + HeadBgColor + "'>Status</th>";
    };

    MyTableHead = MyTableHead + "</tr>";
    MyTable = MyTableHead + "<tr>";

    for (let x = 0; x < Sensor.length; x++) { //Alle Sensoren durchlaufen 
        switch (SensorState[x]) {
            case "ok":
                BgColor = TblOkBgColor;
                break;
            case "info":
                BgColor = TblInfoBgColor;
                break;
            case "warn":
                BgColor = TblWarnBgColor;
                break;
            case "dead":
                BgColor = TblDeadBgColor;
                break;
            default:
        };

        MyTable = MyTable + "<tr>"
        if (TblShowLfdCol) {
            MyTable = MyTable + "<td " + style0 + BgColor + "'>" + (x + 1) + "</td>";
        };
        if (TblShowDeviceIDCol) {
            MyTable = MyTable + "<td " + style0 + BgColor + "'>" + GetParentId(Sensor[x]) + "</td>";
        };
        if (TblShowDeviceNameCol) {
            MyTable = MyTable + "<td " + style0 + BgColor + "'>" + getObject(GetParentId(Sensor[x]), "common").common.name + "</td>";
        };
        if (TblShowRoomCol) {
            MyTable = MyTable + "<td " + style0 + BgColor + "'>" + GetRoom(x) + "</td>";
        };
        if (TblShowUmaxCol) {
            MyTable = MyTable + "<td " + style1 + BgColor + "'>" + SensorUmax[x].toFixed(1) + "V</td>";
        };
        if (TblShowUistCol) {
            MyTable = MyTable + "<td " + style1 + BgColor + "'>" + SensorVal[x].toFixed(2) + "V</td>";
        };
        if (TblShowUlimitCol) {
            //log(BatteryMinLimit[x]+" hat type="+typeof(BatteryMinLimit[x]))
            MyTable = MyTable + "<td " + style1 + BgColor + "'>" + BatteryMinLimit[x].toFixed(2) + "V</td>";
        };
        if (TblShowProzbatCol) {
            if (typeof (SensorUProz[x]) == "number") {
                MyTable = MyTable + "<td " + style1 + BgColor + "'>" + SensorUProz[x].toFixed(1) + "%</td>";
            }
            else {
                MyTable = MyTable + "<td " + style1 + BgColor + "'>" + SensorUProz[x] + "</td>";
            };
        };
        if (TblShowProzliveCol) {
            if (typeof (SensorLiveProz[x]) == "number") {
                MyTable = MyTable + "<td " + style1 + BgColor + "'>" + SensorLiveProz[x].toFixed(1) + "%</td>";
            }
            else {
                MyTable = MyTable + "<td " + style1 + BgColor + "'>" + SensorLiveProz[x] + "</td>";
            };
        };
        if (TblShowStatusCol) {
            MyTable = MyTable + "<td " + style1 + BgColor + "'>" + SensorState[x] + "</td>";
        };

        MyTable = MyTable + "</tr>";
    };

    MyTable = MyTable + "</table>";
    setState(praefix + "OverviewTable", MyTable);
    //if (logging) log(MyTable);
}


//Trigger für Sensoren erzeugen
function CreateTrigger() {
    for (let x = 0; x < Sensor.length; x++) { //Alle Sensoren durchlaufen
        on(Sensor[x], function (dp) { //Trigger in Schleife erstellen
            let TempVal = dp.state.val;
            let TempUnit = GetUnit(x);
            let TempLiveWindow = SensorUmax[x] - BatteryMinLimit[x]
            switch (typeof (TempVal)) { //Wenn der Sensorwert bool ist (wenn nur LowBatt mit true/false vom Sensor gemeldet wird)
                case "boolean": //Sensorval ist Bool
                    if (TempVal) { //Bei Lowbat=true
                        SensorVal[x] = 0; //Batt wird als leer definiert und 0.1 unter MinLimit gesetzt
                        SensorUProz[x] = 0; //Prozentwerte aus Umax und Sensorwert errechnen;
                        SensorLiveProz[x] = 0; //Lebensprozent auf 0%
                    }
                    else {
                        SensorVal[x] = SensorUmax[x]; //Batt wird als voll definiert und auf Umax gesetzt
                        SensorUProz[x] = 100; //Prozentwerte aus Umax und Sensorwert errechnen
                        SensorLiveProz[x] = 100; //Lebensprozent auf 100%
                    };
                    break;
                case "number": //Sensorval ist Zahl
                    switch (TempUnit) { //Bei Zahlen nach Einheit unterscheiden um % Angaben mit zu verarbeiten
                        case "%": //Bei Datenpunkt Unit = %
                            //if (logging) log("unit= " + TempUnit + " should be %");
                            if (ProzMeansLive) { // Wenn die Prozentangabe bereits Lebensdauer zeigt (Einstellungsoption)
                                SensorLiveProz[x] = TempVal; //Direkt zuweisen aus Sensorwert
                                //SensorUProz[x] = (SensorUmax[x] - ((SensorUmax[x] - BatteryMinLimit[x]) / 100 * SensorLiveProz[x])) / SensorUmax[x] * 100 //Errechne Batteriekapazität
                                //SensorVal[x] = SensorUmax[x] / 100 * SensorUProz[x];  //Errechne Spannung
                                SensorVal[x] = SensorUmax[x] - TempLiveWindow + (TempLiveWindow / 100 * SensorLiveProz[x]); //Errechne Spannung
                                SensorUProz[x] = (SensorVal[x] / SensorUmax[x]) * 100 //Errechne Batteriekapazität

                            }
                            else { //Wenn die Prozentangabe Batteriekapazität darstellt  (Einstellungsoption)
                                SensorUProz[x] = TempVal; //Batteriekapazität in % bestimmen
                                SensorVal[x] = SensorUmax[x] / 100 * SensorUProz[x]; //Sensorwert aus Umax und Prozentwert bestimmen
                                SensorLiveProz[x] = (SensorVal[x] - BatteryMinLimit[x]) / TempLiveWindow * 100; //Restlebensdauer in % ermitteln
                            };

                            break;

                        default: // In allen anderen Fällen
                            SensorVal[x] = TempVal; //Spannung ist Wert vom DP
                            SensorUProz[x] = SensorVal[x] / SensorUmax[x] * 100; //Prozentwerte aus Umax und Sensorwert errechnen
                            SensorLiveProz[x] = (SensorVal[x] - BatteryMinLimit[x]) / TempLiveWindow * 100; //Restlebensdauer in % ermitteln
                    };
                    break;
                case "string": //Sensorval ist Text
                    if (TempVal == "ok") {
                        SensorVal[x] = SensorUmax[x]; //Batt wird als voll definiert und auf Umax gesetzt
                        SensorUProz[x] = 100; //Prozentwerte aus Umax und Sensorwert errechnen
                        SensorLiveProz[x] = 100; //Lebensprozent auf 100%
                    }
                    else if (TempVal != "ok") { //Bei BatteryState != ok
                        SensorVal[x] = 0; //Batt wird als leer definiert und 0.1 unter MinLimit gesetzt
                        SensorUProz[x] = 0; //Prozentwerte aus Umax und Sensorwert errechnen
                        SensorLiveProz[x] = 0; //Lebensprozent auf 0%
                    };
                    break;

                default:
            };
            CheckBatterys(x); //Prüfen
        });
    };

    for (let x = 0; x < WelcheFunktionVerwenden.length; x++) { //Alle Batteriefunktionen durchlaufen
        on(praefix + BatteryMinLimitDp[x], function (dp) { //Trigger erstellen und auslösen wenn min Limit geändert wurde. Dann erneute Komplettprüfung aller Batteriestände
            if (logging) log("Reaching Trigger for :" + praefix + BatteryMinLimitDp[x])
            if (typeof (dp.state.val) != "number") {
                log("MinLimit Wert keine Nummer, sondern " + typeof (dp.state.val), "warn");
            };
            main(); //Neuzuweisung des geänderten Limits an alle Geräte
        });
    };
}

