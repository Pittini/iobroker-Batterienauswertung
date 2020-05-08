# Generisches Script um die Batteriestände beliebig vieler Geräte, auch mit unterschiedlichen Spannungen und LowLimit, zu überwachen und bereits "tote" Geräte zu erkennen.


# Features
* Kann beliebig viele Geräte überwachen welche einen Datenpunkt mit der Batteriespannung, eine Prozentangabe oder zumindest Lowbat zur Verfügung stellen.
* Es können simultan Geräte mit unterschiedlichen Spannungen überwacht werden, z.B. 1,5V und 3V, auch Geräte welche nur LowBat true/false bereitstellen können berücksichtigt werden ebenso wie Prozentwerte in zwei Varianten.
* Zeigt Geräte welche innerhalb einer einstellbaren Zeitspanne keine Aktualisierung mehr gesendet haben (Batterie schon leer oder diconnect)
* Möglichkeit eine Meldung/Ansage via Log/Mail/Alexa/Telegram bei unterschreiten einer einstellbaren Limitspannung auszugeben.
* permanente Anzeige des Gerätes mit der niedrigsten Spannung (außer Lowbat, da hier die Info nicht verfügbar ist).
* Kleines Set aus vordefinierten Standart Vis Widgets (Basic-String, Basic-Bool, Html) zur leichteren Integration, bzw. als Beispiel für eigene Vis Projekte.
* Einfache, dynamisch erstellte Html Übersichtstabelle mit Einstellmöglichkeit welche Spalten angezeigt werden sollen.
* Nach Installation keine Skriptänderungen mehr nötig um neue Geräte hinzuzufügen.

# Installation
1. Unter Aufzählungen > Funktionen, eine oder mehrere Funktion/en hinzufügen - wieviele ist abhängig davon wieviele verschiedene Batteriespannungen ihr überwachen wollt. 
Hier gilt es eine Besonderheit zu beachten: Da in Iobroker nirgends die Information bereitsteht welche Batterien in den Geräten sind, bzw. welche Spannungen vorliegen, müßt Ihr dies dem Skript mitteilen indem hinter dem eigentlichen Funktionsnamen z.B. "BatterieSpannung_" noch die Spannung anzugeben ist - ohne Dezimalpunkt. Z.B. "BatterieSpannung_15" für 1,5V Geräte, "BatterieSpannung_30" für 3V Geräte, "BatterieSpannung_120" für 12V Geräte usw. Wollt Ihr also zwei verschiedene Spannungen überwachen, ergibt das zwei Funktionen. Dies gilt auch für Geräte welche nur Lowbat ausgeben, auch diese haben ja irgendeine, klar definierte, Batteriespannung.   
![batterienauswertungtut2.jpg](/admin/batterienauswertungtut2.jpg) 
Sollte der Punkt "Aufzählungen" bei Euch nicht vorhanden sein, dann hier aktivieren:  
![batterienauswertungtut3.jpg](/admin/batterienauswertungtut3.jpg) 


2. Solltet Ihr noch keine Räume definiert haben, so holt dies bitte jetzt unter Aufzählungen > Räume nach.
3. Nun allen gewünschten Sensoren einen Raum und dem Spannungsdatenpunkt die zur Gerätespannung passende Funktion zuzuweisen. Bitte beachtet dass Räume immer dem gesamten Channel zugewiesen werden und Funktionen nur für dem jeweiligen Datenpunkt, siehe Bild:  
![batterienauswertungtut1.jpg](/admin/batterienauswertungtut1.jpg) 
4. **Nach der Zuweisung, bzw. dem anlegen neuer Aufzählungspunkte ist es sinnvoll die JS Instanz neu zu starten da diese die Änderungen sonst nicht mitbekommt, was dann zu Skriptfehlern führt**.
5. Nun den Inhalt der Skriptdatei [batterienauswertung.js](/batterienauswertung.js) in ein neues JS Projekt kopieren.  
   1. 
   ![batterienauswertungtut4.jpg](/admin/batterienauswertungtut4.jpg) 
   2. Wie Ihr das Skript nennt bleibt Euch überlassen, "BattUeberwachung" ist als Beispiel zu sehen. Ihr solltet jedoch darauf achten dass das Skript im Ordner "common" erstellt wird.
   ![batterienauswertungtut5.jpg](/admin/batterienauswertungtut5.jpg) 
   3. In das nun frisch angelegte, leere Skriptprojekt den Inhalt der Skriptdatei einfügen (Strg V). Das ganze sollte nun in etwa so aussehen:
   ![batterienauswertungtut6.jpg](/admin/batterienauswertungtut6.jpg) 


6. Nun Zeile 8-24 kontrollieren und bei Bedarf anpassen, wofür die einzelnen Zeilen gut sind, steht jeweils im Kommentar rechts daneben. 
7. Zeile 11-14 wäre der richtige Ort falls Telegram, Alexa etc. die Meldungen ausgeben sollen. Dann hier die entsprechenden Daten eintragen und die jeweilige Funktion aktivieren.
8. Skript speichern.
9. Skript starten.
10. In den Objekten, unter Javascript.0.BatterieUeberwachung sollte es jetzt mind. 7 Datenpunkte geben - wieviele genau, ist abhängig davon wieviele verschiedene Spannungen ihr überwacht, da für jede zu Überwachende Spannung autom. ein MinLimit Datenpunkt, z.B. "BatteryMinLimit_30" angelegt wird. 
   ![batterienauswertungtut7.jpg](/admin/batterienauswertungtut7.jpg)  
Diese Datenpunkte haben folgenden Sinn/Bedeutung:
    1. **AllBatteriesOk** - Summenauswertung über alle Batterien - könnt Ihr z.B. in Vis verwenden um Farbwechsel für Icons zu erstellen (siehe Demo Widgets).
    2. **EmptyBatCount** - Zeigt Anzahl der Batterien unter min. Limit.
    3. **DeadDeviceCount** - Zeigt Geräte welche seit Zeit x (Einstellbar) keine Aktualisierung mehr gesendet haben.
    4. **BatteryMinLimit_xx** - Einstellfeld/er für das min. Limit bei Batterien der in xx angegebenen Spannung/en (z.B. "BatteryMinLimit_30"). Dieses Feld gibt es mindestens einmal, je nach Setup aber auch mehrmals, wobei sich immer die Zahl xx ändert. Vom Skript werden hier default Werte gesetzt welche 80% der max. Spannung betragen, können aber von Euch frei angepasst werden da dieser Wert auch etwas Geräteabhängig ist.
    5. **LastMessage** - Die letzte, aktuelle und aktive Warnmeldung, hier steht falls eine Batterie das eingestellte MinLimit unterschreitet und gewechselt werden sollte. Das Feld wird geleert wenn es keine zu wechselnde Batterie gibt.
    6. **NextExpectedLowBatt** - Zeigt an welche Batterie vorrausichtlich als nächste leer wird, sich aber noch innerhalb des Limits befindet, damit Ihr schon mal die richtige neue Batterie besorgen könnt.  
    7. **OverviewTable** - Eine einfache, dynamisch erstellte HTML Tabelle, mit Übersicht aller Geräte, Raumzuordnungen, Sollspannungen, Istspannungen und errechnete Prozentwerte um die Daten vergleichbar zu machen trotz unterschiedlicher Grundspannungen. Wird im Vis Widget Satz verwendet.
 1.  Damit ist die Installation des Skriptes abgeschlossen und Ihr könnt bei Bedarf den [Demowidgetsatz](/viswidgets.txt) in Euer Vis Projekt, via "Widgets importieren" einfügen.
    

# Demo Widget Satz für Vis
viswidgets.txt ist ein kleiner Demowidgetsatz welche die relevanten Infos des Skriptes visualisiert.  
Es besteht aus drei einfachen Basiswidgets welche vorkonfiguriert wurden und die Batterie Infos von "ganz einfach" mit nur einem Icon, bis zur umfangreichen Übersichtstabelle darstellen können.
1. Ein simples Icon welches grün insgesamt volle Batterien anzeigt, rot blinkend eine (oder mehrere) zu wechselnde Batterie/n.  
![widgetstut1.png](/admin/widgetstut1.png) ![widgetstut2.png](/admin/widgetstut2.png) 
2. Eine etwas ausführlichere Darstellung, bestehend aus:  
    * links ein Batteriesymbol mit grünem Hintergrund, welches bei Limitunterscheidung rot blinkt. 
    * Gleichzeitig wird die im grünen Zustand unsichtbare Lastmessage eingeblendet und blinkt ebenfalls rot. 
    * Immer sichtbar ist die Anzeige der vorrausichtlich nächsten Batterie welche leer wird, mit Raum und Geräteangabe (hier werden Geräte welche nur Lowbat true/false liefern aufgrund der mangelnden Daten nicht berücksichtigt).  

    ![battok.png](/admin/battok.png) 
    ![battalarm1.png](/admin/battalarm1.png) 

    Beide Widgets bestehen jeweil aus nur einem Basic Widget und können jederzeit von Euch geändert werden. Sie verwenden jedoch das Iconset "Mfd icons as SVG" welches (als Adapter) installiert sein sollte, sonst fehlt das Batteriesymbol. 
    ![widgetstut5.jpg](/admin/widgetstut5.jpg)
    Selbstverständlich könnt ihr aber auch andere, eigene Icons eintragen.  
3. Das dritte Widget besteht aus einem einfachen HTML Widget mit Binding und zeigt Euch eine Übersicht über alle Geräte, Räume und Batteriestände.      
   * Gesondert markiert (in der Grundeinstellung gelb) wird die Zeile des Gerätes mit dem niedrigsten prozentualen Batteriestand welches sich aber noch innerhalb des festgelegten Limits befindet (hier werden Geräte welche nur Lowbat true/false liefern aufgrund der mangelnden Daten nicht berücksichtigt).  
   * Ebenfalls gesondert markiert (in der Grundeinstellung rot) wird die Zeile mit Geräten unterhalb des Limits. Diese Markierung erscheint nur wenn eine Batterie das Limit unterschreitet und verschwindet wieder sobald die Spannung der Batterie wieder im Sollbereich ist.  

    ![widgetstut6a.png](/admin/widgetstut6a.png)  

    **Info:** 
    * Spalte "lfd" zeigt fortlaufende Nummer, zählt also die zugewiesenen Geräte.
    * Spalte "Sensor" ID zeigt die ID des Gerätes
    * Spalte "Sensor Name" zeigt Name des Gerätes
    * Spalte "Raum" zeigt den dem Gerät zugewiesenen Raum
    * Spalte "UNenn" zeigt welche Batteriespannung Ihr den Geräten in der Funktion zugewiesen habt und sollte der Nennspannung der Batterie/en entsprechen.
    * Die "Ist"-Spalte gibt mit Ausnahme der lowbat Geräte die Werte der jeweiligen Datenpunkte aus. Bei lowbat Geräten greift folgendes Verfahren: 
      * bei lowbat=false wird die volle Umax Spannung angenommen, 
      * bei lowbat=true wird eine Spannung 0.1Volt unter dem eingestellten Limit angenommen.
    * Spalte "ULimit" zeigt die für das Gerät eingestellte Limit Spannung ab der eine Warnung ausgegeben wird.
    * Die "%bat" Spalte errechnet sich unter Verwendung von Umax/UNenn und zeigt (mit den oben erwähnten einschränkungen bei lowbat Geräten) die restliche Batteriekapazität in %.
    * Die "%live" Spalte zeigt die prozentuale restliche Lebensdauer des Gerätes an. Dies ist auch der %Wert welcher beim mi-home Adapter ausgegeben wird. Beispiel: Im Gerät ist eine 3V Batterie verbaut. Das Gerät fällt aus bei 2V, verbleibt ein "Spannungsfenster" von 1V. Hat die Batterie nun den aktuellen Stand von 2.5V, so würde dies ein %live von 50% ergeben, während die Batteriekapazität bei 75% stehen würde. Die ist quasi der Wert wie Ihr ihn z.B vom Handy kennt. das Gerät fällt bei 0% aus, da hat die Batterie aber durchaus noch zig% der Nennspannung.
    * Spalte "Status" zeigt den vom Skript ermittelten Status der Batterie, welcher auch für die Anzeige der Farbbalken verwendet wird in Textform.

* Die in der Tabelle verwendeten Farben könnt Ihr im Skript, Zeile 21-26 ändern. Es sind sowohl benannte Farben z.B. "red" als auch Hexwerte mit vorangestelltem # , z.B. "#ff0000" erlaubt. Eine Übersicht benannter Farben und Hex-Werte findet Ihr z.B. [hier](https://wiki.selfhtml.org/wiki/Grafik/Farbpaletten).


---


# Changelog
#### 8.5.20 (1.6.1)
* Fix: Bei nicht vorhandenem Raum wird statt Skriptfehler nur "Nicht zugewiesen" in der Raumspalte vermerkt.
* Fix: Fehler behoben welcher einmal als "tot" markierte Geräte auch bei Aktualisierung nicht mehr "wiederbelebte".
#### 6.5.20 (1.6.0)
* Add: Datenpunkt EmptyBatCount - Zeigt Anzahl der Batterien unter min. Limit.
* Add: Datenpunkt DeadDeviceCount - Zeigt Geräte welche seit Zeit x (Einstellbar) keine Aktualisierung mehr gesendet haben.
* Add: Überprüft zyklisch nach Geräten welche seit Zeit x (Einstellbar) keine Aktualisierung mehr gesendet haben. Dies wird mit zusätzlicher Farbe (default Grau) angezeigt. Hierzu zusätzlichen, neuen, Status "dead" eingeführt.
#### 3.5.20 (1.5.9)
* Add: Sonderregel für Namensausgabe bei shelly Datenstruktur eingefügt.
* Fix: HM und shelly Strukturen werden jetzt auch außerhalb Instanz 0 berücksichtigt.
* Fix: Falsche Logmeldung beseitigt.
* Fix: Falsche Benennung des MinLimit Dps bei Spannungen über 9.9V behoben.
* Fix: Zeilenumbruch bei UseMail und mehreren Meldungen korrigiert.
#### 28.4.20 (1.5.5)
* Add: Sonderregel für Namensausgabe bei HM Datenstruktur eingefügt.
#### 26.4.20 (V1.5.4)
* Fix: Bisher unbekannter Status "ok" (FHEM) integriert.
#### 14.4.20 (V1.5.3)
* Fix: Lastmessage wurde unter bestimmten Bedingungen nicht gelöscht.
* Fix: Trigger für MinLimit Einstellfeld hat bei Änderung nicht ausgelöst.
* Fix: Rechtschreibfehler in Logmeldung korrigiert.
#### 13.4.20 (V1.5.2)
* Fix: Problem mit Lowbat Sensoren behoben.
#### 2.4.20 (V1.5.1)
* Fix: Statusspalte kann nun wie vorgesehen ausgeblendet werden.
* Add: Bei leeren Spannungs- oder %- Werten wird nun 0 angenommen um Fehler zu vermeiden.
#### 2.4.20 (V1.5.0)
* Add: Es können nun auch Sensoren welche nur % Angaben liefern mit überwacht werden. Dies gilt sowohl für Batteriekapazitäts %, als auch für restliche Lebensdauer % (muß in den Optionen gewählt werden).
* Add: Zusätzliche Spalten in der Tabelle lfd, Umin, Device Name, Live%, Status.
* Add: Gewünschte Tabellenspalten können nun im Einstellungsbereich aktiviert/deaktiviert werden.
* Change: Spalte Sensor umbennannt zu Sensor ID und zeigt jetzt die ID des Gerätes statt der ID des Datenpunktes.
* Change: Spalte Umax umbenannt zu UNenn
* Add: Nun auch Nachrichtenversand via Mail möglich 
* Change: Batteriespannungsangabe bei Lastmessage auf 2 Nachkommastellen gerundet.
#### 30.3.2020 (V 1.4)
* Add: Skript kann nun simultan verschiedene Batteriespannungen üerwachen
#### 27.3.2020 (V 1.3.1)
* Change: Unterstriche in Raumnamen werden bei Ausgaben durch Leerzeichen ersetzt  
* Add: Bei Skriptstart werden nun alle deklarierten Geräte ausgegeben, sowie die Gesamtzahl dieser.
#### 26.3.2020 (V 1.3)
* Init  

