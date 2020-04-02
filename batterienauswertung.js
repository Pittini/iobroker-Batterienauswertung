// Batterieüberwachungsskript Version 1.5 Stand 2.04.2020
//Überwacht Batteriespannungen beliebig vieler Geräte 

//WICHTIG!!!
//Vorraussetzungen: Den Gerätechannels müssen Räume, sowie die Funktion "BatterieSpannung_xx" für jeden entsprechenden Batteriespannungs Datenpunkt zugewiesen sein.

//Grund Einstellungen
const praefix = "javascript.0.BatterieUeberwachung."; //Grundpfad für Script DPs
const logging = true; //Logging aktivieren?
const FunktionBaseName = "BatterieSpannung_"; //Name der Funktion welche für die Batterieüberwachung genutzt wird
const UseTelegram = false; // Sollen Nachrichten via Telegram gesendet werden?
const UseMail = false; // Sollen Nachrichten via Mail gesendet werden?
const UseAlexa = false; // Sollen Nachrichten via Alexa ausgegeben werden?
const AlexaId = ""; // Die Alexa Seriennummer
const UseSay = false; // Sollen Nachrichten via Say ausgegeben werden? Funktion des Authors, sollte bei Anwendern auf false gesetzt werden.
const UseEventLog = false; // Sollen Nachrichten ins Eventlog geschreiben werden? Funktion des Authors, sollte bei Anwendern auf false gesetzt werden.
const UsePopUp = false // Soll PopUp angezeigt werden? Funktion des Authors, sollte bei Anwendern auf false gesetzt werden.
const ProzMeansLive = true; //Zeigen Prozentwerte des Gerätedatenpunktes Batteriekapazität oder restliche Lebensdauer?

//Tabellen Einstellungen
const TblOkBgColor = "lightgreen"; //Hintergrundfarbe für Batteriestatus Ok
const TblInfoBgColor = "khaki"; //Hintergrundfarbe für Batteriestatus Info, also die leerste Batterie welche noch nicht das Limit unterschreitet
const TblWarnBgColor = "salmon"; //Hintergrundfarbe für Batteriestatus Warnung, also jene Batterie welche unter das Limit kam.
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

let DpCount = 0; //Zähler für anzulegende Datenpunkte
const States = []; //States Array initialisieren
const Sensor = [] //Sensoren Array initialisieren
const SensorVal = []; //SensorDatenpunkte Werte Array initialisieren
const SensorUmax = []; //Sensoren Array Batteriespannungswerte Werte initialisieren
const SensorUProz = []; //Sensoren Array Spannung in Prozent initialisieren
const SensorLiveProz = []; //Sensoren Array verbleibende Lebendauer unter Berücksichtigung des min Limits, nicht zu verwechseln mit Batteriekapazität in %
const SensorState = []; //Statusarray, mögliche Werte ok,info,warn
const BatteryMinLimit = [];
const WelcheFunktionVerwenden = []; // Array mit allen Einträgen aus Funktionen welche den FunktionBaseName beinhalten
let AllBatterysOk = true;
let LastMessage = "";
let LastMessageSeparator = "<br>";
let NextExpectedLowBatt = "";

//function CreateStates() {
//Datenpunkte anlegen in javascript.0.BatterieUeberwachung.
States[DpCount] = { id: praefix + "AllBatterysOk", initial: true, forceCreation: false, common: { read: true, write: true, name: "Alle Batterien Ok?", type: "boolean", role: "state", def: false } }; //
DpCount++;
States[DpCount] = { id: praefix + "LastMessage", initial: "", forceCreation: false, common: { read: true, write: true, name: "Letzte Warnmeldung", type: "string", role: "state", def: "" } }; //
DpCount++;
FillWelcheFunktionVerwenden(); //Vorab Funktionen mit Umax Spannungen einlesen da diese für ID und Namen der MinLimit States benötigt werden

for (let x = 0; x < WelcheFunktionVerwenden.length; x++) {
    let dummy = WelcheFunktionVerwenden[x].slice(FunktionBaseName.length) //Letzten Zeichen aus Funktionsnamen extrahieren
    let VoltInitial = CreateUmaxValueFromString(x) //Extrahierte Zeichen zu Kommazahl wandeln 
    VoltInitial = VoltInitial / 100 * 80; //Initialwert für Limit berechnen
    if (logging) log("InitialSpannung " + x + " gesetzt auf 80%= " + VoltInitial);
    States[DpCount] = { id: praefix + "BatteryMinLimit_" + dummy, initial: VoltInitial, forceCreation: false, common: { read: true, write: true, name: "Unteres Limit für Warnmeldung bei " + toFloat(dummy.substr(0, 1) + "." + dummy.substr(1, 1)) + "V Geräten", type: "number", role: "value", unit: "V", def: 2.6 } }; //
    DpCount++;
};
States[DpCount] = { id: praefix + "NextExpectedLowBatt", initial: "", forceCreation: false, common: { read: true, write: true, name: "Vorraussichtlich nächste zu wechselnde Batterie", type: "string", role: "state", def: "" } }; //
DpCount++;
States[DpCount] = { id: praefix + "OverviewTable", initial: "", forceCreation: false, common: { read: true, write: true, name: "Einfache HTML Übersichtstabelle", type: "string", role: "state", def: "" } }; //

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
    let dummy = WelcheFunktionVerwenden[x].slice(FunktionBaseName.length) //Aus der Funktionsbezeichnung die letzten beiden Zeichen extrahieren= z.B. 33
    return toFloat(dummy.slice(0,dummy.length- 1) + "." + dummy.slice(-1)) //Die extrahierten Zeichen zu einer Kommazahl wandeln= z.B. 3.3
}

function Init() {
    if (logging) log("Reaching init()");
    let counter = 0; //Zähler für Devices
    let TempVal // Temporärer Sensorwert um nicht mehrere GetStates zu benötigen
    let TempUnit //Einheit für Unterscheidung ob % vorliegen
    let Funktionen = getEnums('functions'); //Alle Funktionen der Aufzählung in Array Funktionen übertragen
    for (let x in Funktionen) {        // loop ueber alle Funktionen
        let Funktion = Funktionen[x].name; // Einzelne Funktion aus dem Array
        if (typeof Funktion == 'object') Funktion = Funktion.de; //Wenn Rückgabewert ein Objekt ist, ist die Funktion mehrsprachig und es wird die deutsche Bezeichnug verwendet
        let members = Funktionen[x].members; //Array mit allen Mitgliedern der Funktion erzeugen
        for (let z = 0; z < WelcheFunktionVerwenden.length; z++) { //Loop über alle Funktions welche zu WelcheFunktionVerwenden passen
            if (Funktion == WelcheFunktionVerwenden[z]) { //Wenn Function ist WelcheFunktionVerwenden (BatterieSpannung)
                let Umax = CreateUmaxValueFromString(z) //Batteriesollspannung aus der Funktionsbezeichnung extrahieren
                let BattMinLimitTemp = getState(praefix + "BatteryMinLimit_" + WelcheFunktionVerwenden[z].slice(FunktionBaseName.length)).val //Temporäres (für den jeweiligen Schleifendurchlauf) MinLimit einlesen
                for (let y in members) { // Loop über alle WelcheFunktionVerwenden Members
                    Sensor[counter] = members[y]; //Treffer in SenorIDarray einlesen
                    TempVal = getState(Sensor[counter]).val;//Wert vom Sensor in Tempval einlesen um wiederholte Getstates zu vermeiden
                    TempUnit = GetUnit(counter);
                    //if (logging) log(typeof (TempVal))
                    switch (typeof (TempVal)) { //Wenn der Sensorwert bool ist (wenn nur LowBatt mit true/false vom Sensor gemeldet wird)
                        case "boolean": //Sensorval ist Bool
                            if (TempVal) { //Bei Lowbat=true
                                SensorVal[counter] = BattMinLimitTemp - 0.1; //Batt wird als leer definiert und 0.1 unter MinLimit gesetzt
                                SensorUProz[counter] = SensorVal[counter] / Umax * 100; //Prozentwerte aus Umax und Sensorwert errechnen
                                SensorLiveProz[counter] = 0; //Lebensprozent auf 0%
                            }
                            else {
                                SensorVal[counter] = Umax; //Batt wird als voll definiert und auf Umax gesetzt
                                SensorUProz[counter] = SensorVal[counter] / Umax * 100; //Prozentwerte aus Umax und Sensorwert errechnen
                                SensorLiveProz[counter] = 100; //Lebensprozent auf 100%
                            };
                            break;
                        case "number": //Sensorval ist Zahl
                            switch (TempUnit) { //Bei Zahlen nach Einheit unterscheiden um % Angaben mit zu verarbeiten
                                case "%": //Bei Datenpunkt Unit = %
                                    //if (logging) log("unit= " + TempUnit + " should be %");
                                    if (ProzMeansLive) { // Wenn die Prozentangabe bereits Lebensdauer zeigt (Einstellungsoption)
                                        SensorLiveProz[counter] = TempVal; //Direkt zuweisen aus Sensorwert
                                        SensorUProz[counter] = (Umax - ((Umax - BattMinLimitTemp) / 100 * SensorLiveProz[counter])) / Umax * 100 //Errechne Batteriekapazität
                                        SensorVal[counter] = Umax / 100 * SensorUProz[counter];  //Errechne Spannung
                                    }
                                    else { //Wenn die Prozentangabe Batteriekapazität darstellt  (Einstellungsoption)
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
        //NumFunktionen--
        //if (NumFunktionen === 0) {
        // if (logging) log("FillWelcheFunktionVerwenden fertig, calling CreateStates!");
        //CreateStates();
        //};
    };
}

function main() {
    if (logging) log("Reaching main()");
    Init(); //Alle Werte einlesen, Arrays füllen, fehlende Werte errechnen
    CreateTrigger(); // Trigger erzeugen
    CheckAllBatterys(); // Alle Batteriestände prüfen
    CheckNextLowBatt(); // Batterie mit niedrigster Spannung finden
    MakeTable(); //HTML Tabelle erzeugen
}

function Meldung(msg) {
    if (UseSay) Say(msg);
    if (UseTelegram) {
        sendTo("telegram.0", "send", {
            text: msg
        });
    };
    if (UseMail) {
        sendTo("email", msg);
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
    let LowestBattProz = 100; //Mit 100% initialisieren
    let LowestBattIndex = 0;
    for (let x = 0; x < Sensor.length; x++) { //Alle Sensoren durchlaufen
        if (SensorState[x] != "warn") SensorState[x] = "ok";
        if (SensorVal[x] > BatteryMinLimit[x]) { // Nur Sensoren berücksichtigen die das min Limit noch nicht unterschritten haben
            if (SensorUProz[x] < LowestBattProz) { //Wenn Sensorwert kleiner LowestBattProz, LowestBattVal auf neuen Wert setzen um das Gerät mit den wenigsten Prozent zu ermitteln
                LowestBattProz = SensorUProz[x];
                LowestBattIndex = x;
            };
        };
    };

    NextExpectedLowBatt = "Aktuell niedrigster Batteriestand (" + SensorVal[LowestBattIndex].toFixed(2) + "V): " + GetRoom(LowestBattIndex) + " bei Gerät " + getObject (GetParentId(Sensor[LowestBattIndex]),"common").common.name;
    setState(praefix + "NextExpectedLowBatt", NextExpectedLowBatt);
    SensorState[LowestBattIndex] = "info";
    if (logging) log(NextExpectedLowBatt);
}

function CheckAllBatterysOk() {
    AllBatterysOk = true;
    for (let x = 0; x < Sensor.length; x++) { //Alle Sensoren durchlaufen
        if (SensorVal[x] < BatteryMinLimit[x]) { // Nur Sensoren berücksichtigen die das min Limit noch nicht unterschritten haben
            AllBatterysOk = false;
        };
    };
    setState(praefix + "AllBatterysOk", AllBatterysOk);
    if (AllBatterysOk == true && LastMessage != "") {
        LastMessage = ""; //Lastmessage löschen
        setState(praefix + "LastMessage", LastMessage); //Meldung in Datenpunkt LastMessage löschen
        if (logging) log("Alle Batterien ok, Lastmessage gelöscht");
    };
}

function CheckBatterys(x) { // Prüfung eines einzelnen Batteriestandes wenn getriggert
    if (logging) log("Reaching CheckBatterys(" + x + ") Val=" + SensorVal[x] + " Limit=" + BatteryMinLimit[x]);
    if (SensorVal[x] < BatteryMinLimit[x]) { //Wenn Min. Wert unterschritten
        LastMessage = "Batteriestand unter Limit im " + GetRoom(x) + " bei Gerät " + getObject(Sensor[x].substring(0, Sensor[x].lastIndexOf("."))).common.name;
        Meldung(LastMessage);
        SensorState[x] = "warn";
    }
    else {
        SensorState[x] = "ok";
    };
    CheckAllBatterysOk();
    CheckNextLowBatt();
    MakeTable();
}

function CheckAllBatterys() { // Prüfung aller Batteriestände bei Skriptstart
    if (logging) log("Reaching CheckAllBatterys() found " + (Sensor.length) + " Devices");
    //LastMessage = ""
    for (let x = 0; x < Sensor.length; x++) { //Alle Sensoren durchlaufen
        if (SensorVal[x] < BatteryMinLimit[x]) { //Wenn Min. Wert unterschritten
            if (logging) log("SensorVal[" + x + "] = " + SensorVal[x] + "V, unterschreitet MinLinmit von " + BatteryMinLimit[x] + " V");
            LastMessage = LastMessage + "Batteriestand unter Limit im " + GetRoom(x) + " bei Gerät " + getObject(Sensor[x].substring(0, Sensor[x].lastIndexOf("."))).common.name + LastMessageSeparator;
            SensorState[x] = "warn";
        }
        else {
            if (SensorState[x] != "info") SensorState[x] = "ok";
        };
    };
    CheckAllBatterysOk()
    LastMessage = LastMessage.substr(0, LastMessage.length - LastMessageSeparator.length); //letzten <br> Umbruch wieder entfernen
    if (LastMessage != "") Meldung(LastMessage); // Wenn Lastmessage nicht leer, Nachricht ausgeben
}

function GetRoom(x) {  // Raum eines Gerätes ermitteln
    let room = getObject(Sensor[x], 'rooms').enumNames[0];
    if (typeof room == 'object') room = room.de;
    room = room.replace(/_/g, " "); //Unterstriche durch Leerzeichen ersetzen
    return room;
}

function GetUnit(x) {
    let unit = getObject(Sensor[x], 'common').common.unit
    return unit;
}

function GetParentId(Id) {
    let parentDevicelId = Id.split(".").slice(0, -1).join(".");// Id an den Punkten in Array schreiben (split), das letzte Element von hinten entfernen (slice) und den Rest wieder zu String zusammensetzen
    return parentDevicelId
}

function MakeTable() {
    if (logging) log("Reaching Mytable");
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
    if (TblShowProzliveCol) {
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
            MyTable = MyTable + "<td " + style1 + BgColor + "'>" + BatteryMinLimit[x].toFixed(2) + "V</td>";
        };
        if (TblShowProzbatCol) {
            MyTable = MyTable + "<td " + style1 + BgColor + "'>" + SensorUProz[x].toFixed(1) + "%</td>";
        };
        if (TblShowProzliveCol) {
            MyTable = MyTable + "<td " + style1 + BgColor + "'>" + SensorLiveProz[x].toFixed(1) + "%</td>";
        };
        if (TblShowProzliveCol) {
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
            switch (typeof (TempVal)) { //Wenn der Sensorwert bool ist (wenn nur LowBatt mit true/false vom Sensor gemeldet wird)
                case "boolean": //Sensorval ist Bool
                    if (TempVal) { //Bei Lowbat=true
                        SensorVal[x] = BatteryMinLimit[x] - 0.1; //Batt wird als leer definiert und 0.1 unter MinLimit gesetzt
                        SensorUProz[x] = SensorVal[x] / SensorUmax[x] * 100; //Prozentwerte aus Umax und Sensorwert errechnen;
                        SensorLiveProz[x] = 0; //Lebensprozent auf 0%
                    }
                    else {
                        SensorVal[x] = SensorUmax[x]; //Batt wird als voll definiert und auf Umax gesetzt
                        SensorUProz[x] = SensorVal[x] / SensorUmax[x] * 100; //Prozentwerte aus Umax und Sensorwert errechnen
                        SensorLiveProz[x] = 100; //Lebensprozent auf 100%
                    };
                    break;
                case "number": //Sensorval ist Zahl
                    switch (TempUnit) { //Bei Zahlen nach Einheit unterscheiden um % Angaben mit zu verarbeiten
                        case "%": //Bei Datenpunkt Unit = %
                            //if (logging) log("unit= " + TempUnit + " should be %");
                            if (ProzMeansLive) { // Wenn die Prozentangabe bereits Lebensdauer zeigt (Einstellungsoption)
                                SensorLiveProz[x] = TempVal; //Direkt zuweisen aus Sensorwert
                                SensorUProz[x] = (SensorUmax[x] - ((SensorUmax[x] - BatteryMinLimit[x]) / 100 * SensorLiveProz[x])) / SensorUmax[x] * 100 //Errechne Batteriekapazität
                                SensorVal[x] = SensorUmax[x] / 100 * SensorUProz[x];  //Errechne Spannung
                            }
                            else { //Wenn die Prozentangabe Batteriekapazität darstellt  (Einstellungsoption)
                                SensorUProz[x] = TempVal; //Batteriekapazität in % bestimmen
                                SensorVal[x] = SensorUmax[x] / 100 * SensorUProz[x]; //Sensorwert aus Umax und Prozentwert bestimmen
                                SensorLiveProz[x] = (SensorVal[x] - BatteryMinLimit[x]) / (SensorUmax[x] - BatteryMinLimit[x]) * 100; //Restlebensdauer in % ermitteln
                            };

                            break;
                        default: // In allen anderen Fällen
                            SensorVal[x] = TempVal; //Spannung ist Wert vom DP
                            SensorUProz[x] = SensorVal[x] / SensorUmax[x] * 100; //Prozentwerte aus Umax und Sensorwert errechnen
                    };
                    break;
                default:
            };
            CheckBatterys(x); //Prüfen
        });
    };

    for (let x = 0; x < WelcheFunktionVerwenden.length; x++) { //Alle Batteriefunktionen durchlaufen
        on(praefix + WelcheFunktionVerwenden[x], function (dp) { //Trigger erstellen und auslösen wenn min Limit geändert wurde. Dann erneute Komplettprüfung aller Batteriestände
            main(); //Neuzuweisung des geänderten Limits an alle Geräte
        });
    };
}

