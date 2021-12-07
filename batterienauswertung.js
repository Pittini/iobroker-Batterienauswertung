const Version = "1.8.5"; // Batterieüberwachungsskript Stand 06.12.2021 - Git: https://github.com/Pittini/iobroker-Batterienauswertung - Forum: https://forum.iobroker.net/topic/31676/vorlage-generische-batteriestandsüberwachung-vis-ausgabe
//Überwacht Batteriespannungen beliebig vieler Geräte 
log("starting Batterieüberwachung V." + Version);
//WICHTIG!!!
//Vorraussetzungen: Den Gerätechannels müssen Räume, sowie die Funktion "BatterieSpannung_xx" für jeden entsprechenden Batteriespannungs Datenpunkt zugewiesen sein.
//Bitte unbedingt Anleitung beachten
// Nach der Zuweisung unbedingt den JS Adpter neu starten!

//Grund Einstellungen
const praefix = "javascript.0.BatterieUeberwachung."; //Grundpfad für Script DPs
const logging = false; //Logging aktivieren?
const FunktionBaseName = "BatterieSpannung_"; //Name der Funktion welche für die Batterieüberwachung genutzt wird
const DeadFunktionName = "DeadCheck"; //Name der Funktion welche für den DeadCheck genutzt wird
const WhichEnumCategoryToUse = "functions"; // Legt fest in welcher Kategorie sich die Aufzählungen befinden! Nur ändern wer weis was er tut!
const UseMail = false; // Sollen Nachrichten via Mail gesendet werden?
const UseSay = false; // Sollen Nachrichten via Say ausgegeben werden? Funktion des Authors, sollte bei Anwendern auf false gesetzt werden.
const UseEventLog = false; // Sollen Nachrichten ins Eventlog geschreiben werden? Funktion des Authors, sollte bei Anwendern auf false gesetzt werden.
const UsePopUp = false // Soll PopUp angezeigt werden? Funktion des Authors, sollte bei Anwendern auf false gesetzt werden.
const ProzMeansLive = true; //Zeigen Prozentwerte des Gerätedatenpunktes Batteriekapazität oder restliche Lebensdauer?
let DeadIsAfter = 4320; // In Minuten - Zeit nach der ein Gerät als "tot" gewertet wird wenn keine Statusänderung (ts) erfolgte.
const NotifyDeadDevices = true; //Sollen "tote" Geräte gemeldet werden?
const NotifyWarnDevices = true;//Sollen Geräte unter Limit gemeldet werden?
const DeconzNameFromDP = false; //Nimmt für Deconz den Namen aus dem Datenpunkt statt aus dem übergeordnetem Channel

//Variablen für Alexa
const UseAlexa = false; // Sollen Nachrichten via Alexa ausgegeben werden?
const AlexaInstance = "alexa2.0";
const AlexaId = ""; // Die Alexa Seriennummer
const AlexaVolume = "50"; // Lautstärke der Nachrichten. Wert von 1 bis 100

//Variablen für Pushover
const UsePushover = false; //Sollen Nachrichten via Pushover versendet werden?
const PushoverDevice = 'All'; //Welches Gerät soll die Nachricht bekommen
const PushoverInstance = "pushover.0"; //Pushoverinstanz welche genutzt werden soll angeben
const PushOverTitle = 'Batterien überprüfen';

//Variablen für Telegram
const UseTelegram = false; // Sollen Nachrichten via Telegram gesendet werden?
const TelegramInstance = "telegram.1"; //Telegraminstanz welche genutzt werden soll angeben
const TelegramUser = ''; //Welche User sollen die Nachricht bekommen? Leer lassen für alle User. Mehrere User getrennt durch Komma.

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
const TblShowHasDeadCheck = true; //Tabellenspalte mit DeadCheckstatus ausgeben?

//Spalten der JSON Tabellen bei Bedarf ausschalten
const TblJSNShowLfdCol = true; //Tabellenspalte mit laufender Nummer anzeigen?
const TblJSNShowDeviceIDCol = true; //Tabellenspalte mit Geräte ID anzeigen?
const TblJSNShowDeviceNameCol = true; //Tabellenspalte mit Gerätenamen anzeigen?
const TblJSNShowRoomCol = true; //Tabellenspalte mit Raum anzeigen?
const TblJSNShowUmaxCol = true; //Tabellenspalte mit Batterie Nennspannung anzeigen? 
const TblJSNShowUistCol = true; //Tabellenspalte mit aktueller Batteriespannung anzeigen?
const TblJSNShowUlimitCol = true; //Tabellenspalte mit unterer Batterielimit Spannung anzeigen?
const TblJSNShowProzbatCol = true; //Tabellenspalte mit Batteriestand in Prozent anzeigen?
const TblJSNShowProzliveCol = true; //Tabellenspalte mit Restlebensdauer unter Berücksichtigung der Limitspannung in Prozent anzeigen? Beispiel: Batterie hat 3V Nennspannung, Limit ist bei 2V, aktueller Batteriestand ist 2.5V, dann wäre die Restlebensdauer 50%
const TblJSNShowStatusCol = true; //Tabellenspalte mit Status ausgeben?
const TblJSNShowHasDeadCheck = true; //Tabellenspalte mit DeadCheckstatus ausgeben?

//Ab hier nix mehr ändern
/** @type {{ id: string, initial: any, forceCreation: boolean, common: iobJS.StateCommon }[]} */
const States = []; //States Array initialisieren
let DpCount = 0; //Zähler für anzulegende Datenpunkte
const Sensor = [] //Sensoren Array initialisieren
const BatteryMinLimitDp = []; //Array mit den generierten MinLimit Einstellungsdatenpunkten
const WelcheFunktionVerwenden = []; // Array mit allen Einträgen aus Funktionen welche den FunktionBaseName beinhalten
let AllBatterysOk = true;
let LastMessageSeparator = "<br>";
let NextExpectedLowBatt = "";
let EmptyBatCount = 0;
let DeadDeviceCount = 0;
let TickerObj;
let IsInit = true;
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
States[DpCount] = { id: praefix + "JSONTable", initial: "", forceCreation: false, common: { read: true, write: false, name: "Einfache JSON Übersichtstabelle", type: "string", role: "state", def: "" } }; //
DpCount++;
States[DpCount] = { id: praefix + "EmptyBatCount", initial: 0, forceCreation: false, common: { read: true, write: false, name: "Zähler für Anzahl der zu wechselnden Batterien", type: "number", role: "state", def: 0 } }; //
DpCount++;
States[DpCount] = { id: praefix + "DeadDeviceCount", initial: 0, forceCreation: false, common: { read: true, write: false, name: "Zähler für Anzahl der nicht mehr aktualisierenden Geräte", type: "number", role: "state", def: 0 } }; //
DpCount++;
States[DpCount] = { id: praefix + "DeviceCount", initial: 0, forceCreation: false, common: { read: true, write: false, name: "Zähler für Anzahl der überwachten Geräte", type: "number", role: "state", def: 0 } }; //
DpCount++;
States[DpCount] = { id: praefix + "DeadCheckCount", initial: 0, forceCreation: false, common: { read: true, write: false, name: "Zähler für Anzahl der gesetzten DeadChecks", type: "number", role: "state", def: 0 } }; //

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
    let Funktionen = getEnums(WhichEnumCategoryToUse); //Array mit Aufzählung der Funktionen
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
                for (let y in members) { // Loop über alle WelcheFunktionVerwenden Members
                    Sensor[counter] = {};
                    Sensor[counter].id = members[y]; //Treffer in SenorIDarray einlesen
                    TempVal = getState(Sensor[counter].id).val;//Wert vom Sensor in Tempval einlesen um wiederholte Getstates zu vermeiden
                    if (typeof (TempVal) == "undefined") TempVal = 0; //Bei leeren Feldern 0 setzen um Fehler zu vermeiden
                    if (typeof (TempVal) == "string") { //Wenn Wert als String deklariert obwohl Zahl
                        if (!isNaN(parseFloat(TempVal))) { //Wenn konvertierung kein NaN ergibt
                            TempVal = parseFloat(TempVal); //Konvertieren
                        };
                    };
                    if (logging) log("existsState(Sensor[counter].id)=" + existsState(Sensor[counter].id) + " typeof (getState(Sensor[counter].id).val)=" + typeof (getState(Sensor[counter].id).val) + " getState(Sensor[counter].id).val=" + getState(Sensor[counter].id).val)
                    Sensor[counter].state = "";
                    Sensor[counter].unit = GetUnit(counter);
                    if (logging) log("Tempval=" + TempVal + " TempUnit=" + TempUnit + " TypeOf=" + typeof (TempVal));
                    Sensor[counter].uMax = Umax; //Synchrones UmaxArray füllen
                    Sensor[counter].batteryMinLimit = BattMinLimitTemp;

                    MainCalc(TempVal, counter)

                    if (Sensor[counter].liveProz > 100) Sensor[counter].liveProz = 100; //Um bei übervollen Batterien mehr als 100% live zu vermeiden
                    if (logging) log(counter + " " + Funktion + ' found at ' + members[y] + " Umax= " + Sensor[counter].uMax + " BattMinLimit=" + BattMinLimitTemp + " Val= " + Sensor[counter].value + " SensorProzent= " + Sensor[counter].uProz);
                    counter++;
                };
                setState(praefix + "DeviceCount", counter, true);
            };
        };
    };
}

function MainCalc(TempVal, counter) {
    if (logging) log("Reaching MainCalc, TempVal=" + TempVal + " counter=" + counter);

    let TempLiveWindow = Sensor[counter].uMax - Sensor[counter].batteryMinLimit;

    switch (typeof (TempVal)) { //Wenn der Sensorwert bool ist (wenn nur LowBatt mit true/false vom Sensor gemeldet wird)
        case "boolean": //Sensorval ist Bool
            if (TempVal) { //Bei Lowbat=true
                Sensor[counter].value = 0; //Batt wird als leer definiert und auf 0 gesetzt
                Sensor[counter].uProz = 0; //Prozentwerte aus Umax und Sensorwert errechnen
                Sensor[counter].liveProz = 0; //Lebensprozent auf 0%
            }
            else {
                Sensor[counter].value = Sensor[counter].uMax; //Batt wird als voll definiert und auf Umax gesetzt
                Sensor[counter].uProz = 100; //Prozentwerte aus Umax und Sensorwert errechnen
                Sensor[counter].liveProz = 100; //Lebensprozent auf 100%
            };
            break;
        case "number": //Sensorval ist Zahl
            switch (Sensor[counter].unit) { //Bei Zahlen nach Einheit unterscheiden um % Angaben mit zu verarbeiten
                case "%": //Bei Datenpunkt Unit = %
                    //if (logging) log("unit= " + TempUnit + " should be %");
                    if (ProzMeansLive) { // Wenn die Prozentangabe bereits Lebensdauer zeigt (Einstellungsoption)
                        Sensor[counter].liveProz = TempVal; //Direkt zuweisen aus Sensorwert
                        Sensor[counter].value = Sensor[counter].uMax - TempLiveWindow + (TempLiveWindow / 100 * Sensor[counter].liveProz);
                        Sensor[counter].uProz = (Sensor[counter].value / Sensor[counter].uMax) * 100 //Errechne Batteriekapazität
                    }
                    else if (!ProzMeansLive) { //Wenn die Prozentangabe Batteriekapazität darstellt  (Einstellungsoption)
                        Sensor[counter].uProz = TempVal; //Batteriekapazität in % bestimmen
                        Sensor[counter].value = Sensor[counter].uMax / 100 * Sensor[counter].uProz; //Sensorwert aus Umax und Prozentwert bestimmen
                        Sensor[counter].liveProz = (Sensor[counter].value - Sensor[counter].batteryMinLimit) / (Sensor[counter].uMax - Sensor[counter].batteryMinLimit) * 100; //Restlebensdauer in % ermitteln
                    };

                    break;
                default: // In allen anderen Fällen
                    Sensor[counter].value = TempVal; //Spannung ist Wert vom DP
                    Sensor[counter].uProz = Sensor[counter].value / Sensor[counter].uMax * 100; //Prozentwerte aus Umax und Sensorwert errechnen
                    Sensor[counter].liveProz = (Sensor[counter].value - Sensor[counter].batteryMinLimit) / (Sensor[counter].uMax - Sensor[counter].batteryMinLimit) * 100; //Restlebensdauer in % ermitteln
            };
            break;
        case "string": //Sensorval ist Text
            if (TempVal == "ok" || TempVal == "NORMAL") {
                Sensor[counter].value = Sensor[counter].uMax; //Batt wird als voll definiert und auf Umax gesetzt
                Sensor[counter].uProz = 100; //Prozentwerte aus Umax und Sensorwert errechnen
                Sensor[counter].liveProz = 100; //Lebensprozent auf 100%
            }
            else { //Bei BatteryState != ok
                Sensor[counter].value = 0; //Batt wird als leer definiert und 0.1 unter MinLimit gesetzt
                Sensor[counter].uProz = 0; //Prozentwerte aus Umax und Sensorwert errechnen
                Sensor[counter].liveProz = 0; //Lebensprozent auf 0%
            };
            break;
        default:
    };

}


function FillWelcheFunktionVerwenden() {
    if (logging) log("Reaching FillWelcheFunktionVerwenden");
    let z = 0;
    let Funktionen = getEnums(WhichEnumCategoryToUse); //Array mit Aufzählung der Funktionen
    for (let x in Funktionen) {        // loop ueber alle Funktionen
        let Funktion = Funktionen[x].name; // Einzelne Funktion aus dem Array
        if (typeof Funktion == 'object') Funktion = Funktion.de; //Wenn Rückgabewert ein Objekt ist, ist die Funktion mehrsprachig und es wird die deutsche Bezeichnung verwendet
        if (Funktion.includes(FunktionBaseName)) {
            WelcheFunktionVerwenden[z] = Funktion;
            if (logging) log("Found Function " + WelcheFunktionVerwenden[z]);
            z++;
        };
    };
}

function main() {
    if (logging) log("Reaching main()");
    Init(); //Alle Werte einlesen, Arrays füllen, fehlende Werte errechnen
    if (IsInit) CreateTrigger(); // Trigger erzeugen
    CheckAllBatterys(); // Alle Batteriestände prüfen
    CheckAllBatterysOk();
    CheckNextLowBatt(); // Batterie mit niedrigster Spannung finden
    MakeTable(); //HTML Tabelle erzeugen
	MakeJSONTable(); //JSON Tabelle erzeugen
    if (IsInit) Ticker(); //Startet Intervallprüfung für nicht aktualisierende Geräte
    IsInit = false;
}

function Meldung(msg) {
    log("Reaching Meldung(), msg=" + msg);
    if (UseSay) Say(msg);
    if (UseTelegram) {
        sendTo(TelegramInstance, "send", {
            user: TelegramUser,
            text: msg
        });
    };
    if (UseMail) {
        sendTo("email", {
            html: msg
        });
    };
    if (UseAlexa) {
        if (AlexaId != "") setState(AlexaInstance + ".Echo-Devices." + AlexaId + ".Commands.announcement"/*announcement*/, AlexaVolume + "; " + msg);
    };
    if (UsePushover) {
        sendTo(PushoverInstance, {
            device: PushoverDevice,
            message: msg,
            title: PushOverTitle,
            priority: 0,
            retry: 60,
            expire: 600,
            html: 1
        });
    };

    if (logging) log(msg);
    if (UseEventLog) WriteEventLog(msg);
    if (UsePopUp) ShowPopUp(true, msg, "Batterys", "red");
}

function CheckDeadBatt() {
    if (logging) log("Reaching CheckDeadBatt()");
    let jetzt = new Date().getTime();
    let Funktionen = getEnums(WhichEnumCategoryToUse); //Array mit Aufzählung der Funktionen
    DeadDeviceCount = 0;
    let members;
    let counter = 0;
    for (let y in Funktionen) {        // loop ueber alle Funktionen
        let Funktion = Funktionen[y].name; // Einzelne Funktion aus dem Array
        if (typeof Funktion == 'object') Funktion = Funktion.de; //Wenn Rückgabewert ein Objekt ist, ist die Funktion mehrsprachig und es wird die deutsche Bezeichnung verwendet
        if (Funktion.includes(DeadFunktionName)) {
            members = Funktionen[y].members; //Array mit allen Mitgliedern der Funktion erzeugen
        };
    };

    for (let x = 0; x < Sensor.length; x++) { //Alle Sensoren durchlaufen
        if (existsState(Sensor[x].id)) {
            let ParentDeviceId = GetParentId(Sensor[x].id);
            Sensor[x].isDead = false;
            Sensor[x].hasDeadCheck = false;

            //Check at Extra Function Datapoint DeadCheck
            for (let z in members) {
                if (members[z].includes(ParentDeviceId)) {    //Jetzt prüfen ob Funktion DeadCheck innerhalb des Channels
                    Sensor[x].hasDeadCheck = true;
                    if (logging) log("Device " + ParentDeviceId + " has Deadcheck, now checking");
                    if (logging) log("z=" + z + " Device " + ParentDeviceId + " check at  " + members[z]);
                    if ((getState(members[z]).ts + (DeadIsAfter * 60 * 1000)) < jetzt) {
                        if (logging) log("Deadcheck failed, " + ParentDeviceId + " seems to be dead");
                        Sensor[x].isDead = true;
                    } else {
                        if (logging) log(ParentDeviceId + " is not dead");
                        Sensor[x].isDead = false;
                    };
                    counter++;
                };
            };
            setState(praefix + "DeadCheckCount", counter, true);

            //Reaction after checks
            if (Sensor[x].isDead) {
                if (logging) log("Jim...he's dead")
                if (Sensor[x].state != "dead") { //Wenn Sensor bei vorheriger Prüfung noch nicht tot, Meldung absetzen.
                    CheckForAlerts()
                };
                Sensor[x].state = "dead"; //Status auf tot setzen
                DeadDeviceCount++; //Zähler ehöhen
            } else {
                if (Sensor[x].state == "dead") { //Wenn Sensor bisher als tot gelistet, aber wieder aktualisiert, Status prüfen
                    Sensor[x].state = "ok";
                    Sensor[x].isDead = false;
                    CheckBatterys(x);
                };
            };
        } else {
            log("CheckDeadBatt() State for " + x + " doesnt exists");
        };

        if (x == Sensor.length - 1) { //Ausführung erst wenn Schleife komplett durch ist (async)
            setState(praefix + "DeadDeviceCount", DeadDeviceCount, true);
            MakeTable();
			MakeJSONTable();
        };
    };
}

function Ticker() {
    CheckDeadBatt(); //Auf nicht mehr aktualisierende Geräte seit Zeit x (Einstellung) prüfen
    setInterval(function () { // Wenn 
        CheckDeadBatt();
    }, 60000);
}


function CheckNextLowBatt() { //Ermittelt die Batterie mit der geringsten Spannung, ignoriert Batterien welche das Limit bereits unterschritten haben da diese bereits in der LastMessage gemeldet werden
    if (logging) log("Reaching CheckNextLowBatt()");

    let LowestBattProz = 100; //Mit 100% initialisieren
    let LowestBattIndex = 0;
    for (let x = 0; x < Sensor.length; x++) { //Alle Sensoren durchlaufen
        if (Sensor[x].state != "warn" && Sensor[x].state != "dead") Sensor[x].state = "ok";
        if (Sensor[x].value > Sensor[x].batteryMinLimit) { // Nur Sensoren berücksichtigen die das min Limit noch nicht unterschritten haben
            if (Sensor[x].liveProz <= LowestBattProz) { //Wenn Sensorwert kleiner LowestBattProz, LowestBattVal auf neuen Wert setzen um das Gerät mit den wenigsten Prozent zu ermitteln
                LowestBattProz = Sensor[x].liveProz;
                LowestBattIndex = x;
            };
        };
    };

    NextExpectedLowBatt = "Aktuell niedrigster Batteriestand (" + Sensor[LowestBattIndex].value.toFixed(2) + "V): " + GetRoom(LowestBattIndex) + " bei Gerät " + GetName(LowestBattIndex);
    setState(praefix + "NextExpectedLowBatt", NextExpectedLowBatt, true);
    Sensor[LowestBattIndex].state = "info";
    if (logging) log(NextExpectedLowBatt);
}

function CheckAllBatterysOk() {
    if (logging) log("Reaching CheckAllBatterysOk");
    AllBatterysOk = true;
    EmptyBatCount = 0;
    for (let x = 0; x < Sensor.length; x++) { //Alle Sensoren durchlaufen
        if (Sensor[x].value <= Sensor[x].batteryMinLimit) { // Nur Sensoren berücksichtigen die das min Limit unterschritten haben
            AllBatterysOk = false;
            EmptyBatCount++; //Alle Sensoren zählen welche das Batt min Limit unterschritten haben
        };
    };

    //  if (DeadDeviceCount > 0) AllBatterysOk = false;

    setState(praefix + "EmptyBatCount", EmptyBatCount, true);
    setState(praefix + "AllBatterysOk", AllBatterysOk, true);
}


let OldTempMsg = "";
function CheckForAlerts() {
    if (logging) log("Reaching CheckLastMessage, EmptyBatCount=" + EmptyBatCount + " DeadDeviceCount=" + DeadDeviceCount);
    let TempMsg = "";

    for (let x = 0; x < Sensor.length; x++) { //Alle Sensoren durchgehen
        if (Sensor[x].message != "" && NotifyWarnDevices) { //Wenn msg vorhanden und Warnungen aktiv
            if (TempMsg == "") {
                TempMsg = Sensor[x].message;
            } else {
                TempMsg += LastMessageSeparator + Sensor[x].message;
            };
        };

        if (Sensor[x].isDead && NotifyDeadDevices) { //Wenn msg vorhanden und Dead Warnungen aktiv
            if (TempMsg == "") {
                TempMsg = "Ausfall oder disconnect im " + GetRoom(x) + " bei Gerät " + GetName(x);
            } else {
                TempMsg += LastMessageSeparator + "Ausfall oder disconnect im " + GetRoom(x) + " bei Gerät " + GetName(x);
            };
        };
    };

    if (TempMsg == "") {
        setState(praefix + "LastMessage", "", true); //Meldung in Datenpunkt LastMessage löschen
        if (logging) log("Alle Batterien ok, Lastmessage gelöscht");
    } else if (OldTempMsg != TempMsg) {
        setState(praefix + "LastMessage", TempMsg, true); //Meldung in Datenpunkt LastMessage schreiben
        Meldung(TempMsg);
    };
    OldTempMsg = TempMsg;
}


function CheckBatterys(x) { // Prüfung eines einzelnen Batteriestandes wenn getriggert
    if (logging) log("Reaching CheckBatterys(" + x + ") Val=" + Sensor[x].value + " Limit=" + Sensor[x].batteryMinLimit);
    if (Sensor[x].value <= Sensor[x].batteryMinLimit) { //Wenn Min. Wert unterschritten
        Sensor[x].message = "Batteriestand (" + parseInt(Sensor[x].value * 100) / 100 + " V) unter Limit (" + Sensor[x].batteryMinLimit + " V) im " + GetRoom(x) + " bei Gerät " + GetName(x);
        Sensor[x].state = "warn";
    }
    else {
        Sensor[x].state = "ok";
        Sensor[x].message = "";
    };
    CheckAllBatterysOk();
    CheckNextLowBatt();
    CheckDeadBatt();
    CheckForAlerts();
    MakeTable();
	MakeJSONTable();
}

function CheckAllBatterys() { // Prüfung aller Batteriestände bei Skriptstart
    if (logging) log("Reaching CheckAllBatterys() found " + (Sensor.length) + " Devices");
    for (let x = 0; x < Sensor.length; x++) { //Alle Sensoren durchlaufen
        if (Sensor[x].state == "dead") {
            if (logging) log("Sensor[" + x + "] = ist ausgefallen oder disconnected");
            Sensor[x].isDead = true;
        }
        else if (Sensor[x].value <= Sensor[x].batteryMinLimit) { //Wenn Min. Wert unterschritten
            if (logging) log("SensorVal[" + x + "] = " + Sensor[x].value + "V, unterschreitet MinLimit von " + Sensor[x].batteryMinLimit + " V");
            Sensor[x].message = "Batteriestand (" + parseInt(Sensor[x].value * 100) / 100 + " V) unter Limit (" + Sensor[x].batteryMinLimit + " V) im " + GetRoom(x) + " bei Gerät " + GetName(x);
            Sensor[x].state = "warn";
        }
        else {
            if (Sensor[x].state != "info" && Sensor[x].state != "dead") {
                Sensor[x].state = "ok";
                Sensor[x].isDead = false;
                Sensor[x].message = "";
            }
        };
    };
    CheckForAlerts();
}

function GetRoom(x) {  // Raum eines Gerätes ermitteln
    let room = getObject(Sensor[x].id, 'rooms').enumNames[0];
    if (room == undefined) room = "Nicht zugewiesen";
    if (typeof room == 'object') room = room.de;
    room = room.replace(/_/g, " "); //Unterstriche durch Leerzeichen ersetzen
    return room;
}

function GetUnit(x) {
    let unit = getObject(Sensor[x].id, 'common').common.unit
    return unit;
}

function GetName(x) {
    let tempName = getObject(GetParentId(Sensor[x].id), "common").common.name;
    if (typeof tempName == "object") tempName = tempName.de;
    return tempName;
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
        MyTableHead += "<th " + headstyle0 + HeadBgColor + "'>lfd</th>";
    };
    if (TblShowDeviceIDCol) {
        MyTableHead += "<th " + headstyle0 + HeadBgColor + "'>Sensor ID</th>";
    };
    if (TblShowDeviceNameCol) {
        MyTableHead += "<th " + headstyle0 + HeadBgColor + "'>Sensor Name</th>";
    };
    if (TblShowRoomCol) {
        MyTableHead += "<th " + headstyle0 + HeadBgColor + "'>Raum</th>";
    };
    if (TblShowUmaxCol) {
        MyTableHead += "<th " + headstyle1 + HeadBgColor + "'>U<br>Nenn</th>";
    };
    if (TblShowUistCol) {
        MyTableHead += "<th " + headstyle1 + HeadBgColor + "'>U<br>Ist</th>";
    };
    if (TblShowUlimitCol) {
        MyTableHead += "<th " + headstyle1 + HeadBgColor + "'>U<br>Limit</th>";
    };
    if (TblShowProzbatCol) {
        MyTableHead += "<th " + headstyle1 + HeadBgColor + "'>%bat</th>";
    };
    if (TblShowProzliveCol) {
        MyTableHead += "<th " + headstyle1 + HeadBgColor + "'>%live</th>";
    };
    if (TblShowStatusCol) {
        MyTableHead += "<th " + headstyle1 + HeadBgColor + "'>Status</th>";
    };
    if (TblShowHasDeadCheck) {
        MyTableHead += "<th " + headstyle1 + HeadBgColor + "'>DC</th>";
    };
    MyTableHead += "</tr>";
    MyTable = MyTableHead + "<tr>";

    for (let x = 0; x < Sensor.length; x++) { //Alle Sensoren durchlaufen 
        switch (Sensor[x].state) {
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

        MyTable += "<tr>";
        if (TblShowLfdCol) {
            MyTable += "<td " + style0 + BgColor + "'>" + (x + 1) + "</td>";
        };
        if (TblShowDeviceIDCol) {
            MyTable += "<td " + style0 + BgColor + "'>" + GetParentId(Sensor[x].id) + "</td>";
        };
        if (TblShowDeviceNameCol) {
            MyTable += "<td " + style0 + BgColor + "'>" + GetName(x) + "</td>";
        };
        if (TblShowRoomCol) {
            MyTable += "<td " + style0 + BgColor + "'>" + GetRoom(x) + "</td>";
        };
        if (TblShowUmaxCol) {
            MyTable += "<td " + style1 + BgColor + "'>" + Sensor[x].uMax.toFixed(1) + "V</td>";
        };
        if (TblShowUistCol) {
            MyTable += "<td " + style1 + BgColor + "'>" + Sensor[x].value.toFixed(2) + "V</td>";
        };
        if (TblShowUlimitCol) {
            MyTable += "<td " + style1 + BgColor + "'>" + Sensor[x].batteryMinLimit.toFixed(2) + "V</td>";
        };
        if (TblShowProzbatCol) {
            if (typeof (Sensor[x].uProz) == "number") {
                MyTable += "<td " + style1 + BgColor + "'>" + Sensor[x].uProz.toFixed(1) + "%</td>";
            }
            else {
                MyTable += "<td " + style1 + BgColor + "'>" + Sensor[x].uProz + "</td>";
            };
        };
        if (TblShowProzliveCol) {
            if (typeof (Sensor[x].liveProz) == "number") {
                MyTable += "<td " + style1 + BgColor + "'>" + Sensor[x].liveProz.toFixed(1) + "%</td>";
            }
            else {
                MyTable += "<td " + style1 + BgColor + "'>" + Sensor[x].liveProz + "</td>";
            };
        };
        if (TblShowStatusCol) {
            MyTable += "<td " + style1 + BgColor + "'>" + Sensor[x].state + "</td>";
        };
        if (TblShowHasDeadCheck) {
            MyTable += "<td " + style1 + BgColor + "'>" + (Sensor[x].hasDeadCheck ? 'x' : '-') + "</td>";
        };
        MyTable = MyTable + "</tr>";
    };

    MyTable += "</table>";
    setState(praefix + "OverviewTable", MyTable, true);
}

function MakeJSONTable() {
    if (logging) log("Reaching MakeJSONTable");
  
    let MyJSONTable;

	//MyJSONTableHead = "[";
    //MyJSONTable = MyJSONTableHead + "{";
	MyJSONTable = "[";

    for (let x = 0; x < Sensor.length; x++) { //Alle Sensoren durchlaufen 

        MyJSONTable += "{";
        if (TblJSNShowLfdCol) {
            MyJSONTable += "\"lfd\":" + "\"" + (x + 1) + "\",";
        };
        if (TblJSNShowDeviceIDCol) {
			MyJSONTable += "\"Sensor ID\":" + "\"" + GetParentId(Sensor[x].id) + "\",";
        };
        if (TblJSNShowDeviceNameCol) {
			MyJSONTable += "\"Sensor Name\":" + "\"" + GetName(x) + "\",";
        };
        if (TblJSNShowRoomCol) {
			MyJSONTable += "\"Raum\":" + "\"" + GetRoom(x) + "\",";
        };
        if (TblJSNShowUmaxCol) {
			MyJSONTable += "\"U Nenn\":" + "\"" + Sensor[x].uMax.toFixed(1) + " V\",";
        };
        if (TblJSNShowUistCol) {
			MyJSONTable += "\"U Ist\":" + "\"" + Sensor[x].value.toFixed(2) + " V\",";
        };
        if (TblJSNShowUlimitCol) {
			MyJSONTable += "\"U Limit\":" + "\"" + Sensor[x].batteryMinLimit.toFixed(2) + " V\",";
        };
        if (TblJSNShowProzbatCol) {
            if (typeof (Sensor[x].uProz) == "number") {
				MyJSONTable += "\"%bat\":" + "\"" + Sensor[x].uProz.toFixed(1) + " %\",";
            }
            else {
				MyJSONTable += "\"%bat\":" + "\"" + Sensor[x].uProz + "\",";
            };
        };
        if (TblJSNShowProzliveCol) {
            if (typeof (Sensor[x].liveProz) == "number") {
				MyJSONTable += "\"%live\":" + "\"" + Sensor[x].liveProz.toFixed(1) + " %\",";
            }
            else {
				MyJSONTable += "\"%live\":" + "\"" + Sensor[x].liveProz + "\",";
            };
        };
        if (TblJSNShowStatusCol) {
			MyJSONTable += "\"Status\":" + "\"" + Sensor[x].state+ "\",";
        };
        if (TblJSNShowHasDeadCheck) {
			MyJSONTable += "\"DC\":" + "\"" + (Sensor[x].hasDeadCheck ? 'x' : '-') + "\",";
        };
		
		//Jetzt das letzte Komma wegtrimmen
		MyJSONTable = MyJSONTable.substring(0, MyJSONTable.length-1);	
		
        MyJSONTable = MyJSONTable + "},";
    };
	
	//Nochmal das letzte Komma wegtrimmen
	MyJSONTable = MyJSONTable.substring(0, MyJSONTable.length-1);
	
    MyJSONTable += "]";
    setState(praefix + "JSONTable", MyJSONTable, true);
}

//Trigger für Sensoren erzeugen
function CreateTrigger() {
    for (let x = 0; x < Sensor.length; x++) { //Alle Sensoren durchlaufen
        on(Sensor[x].id, function (dp) { //Trigger in Schleife erstellen
            let TempVal = dp.state.val;
            //  let TempUnit = GetUnit(x);
            // let TempLiveWindow = Sensor[x].uMax - Sensor[x].batteryMinLimit;
            if (typeof (TempVal == "string")) { //Falls MinLimit Wert String ist zu float wandeln
                //log("Value is String, trying to convert");
                if (!isNaN(parseFloat(TempVal))) { //Wenn konvertierung kein NaN ergibt
                    if (logging) log("Value conversion from String to number - success");
                    TempVal = parseFloat(TempVal); //Konvertieren
                };
            };
            MainCalc(TempVal, x);
            CheckBatterys(x); //Prüfen
        });
    };

    for (let x = 0; x < WelcheFunktionVerwenden.length; x++) { //Alle Batteriefunktionen durchlaufen
        on(praefix + BatteryMinLimitDp[x], function (dp) { //Trigger erstellen und auslösen wenn min Limit geändert wurde. Dann erneute Komplettprüfung aller Batteriestände
            if (logging) log("Reaching Trigger for :" + praefix + BatteryMinLimitDp[x])
            if (typeof (dp.state.val) != "number") {
                log("MinLimit Value not a Number, rather " + typeof (dp.state.val) + ", converting to number", "warn");
                setState(praefix + BatteryMinLimitDp[x], parseFloat(dp.state.val), true)
            };
            main(); //Neuzuweisung des geänderten Limits an alle Geräte
        });
    };

    onStop(function () { //Bei Scriptende alle Timer löschen
        if (typeof TickerObj == "object") clearInterval(TickerObj);
    }, 100);
}
