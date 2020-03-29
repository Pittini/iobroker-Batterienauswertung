# Script um die Batteriestände beliebig vieler Geräte mit gleichem LowLimit zu überwachen

#### Kann beliebige Geräte überwachen welche einen Datenpunkt mit der Batteriespannung zur Verfügung stellen und das gleiche LowLimit haben.
#### Legt vier Datenpunkte an 
* **AllBatterysOk** - Summenfeld 
* **BatteryMinLimit** - Einstellfeld für die LimitSpannung  
* **LastMessage** - Die letzte ausgegebene Nachricht (Wird autom. gelöscht sobald wieder alle Batterien innerhalb des limits sind) - 
* **NextExpectedLowBatt** - Raum und Gerät der Batterie mit aktuell niedrigsten Stand aber noch innerhalb des Limits
#### Möglichkeit eine Meldung/Ansage via Log/Alexa/Telegram auszugeben

# WICHTIG!!!  
### **Vorraussetzungen:** Den Geräten müssen Räume zugewiesen sein (gesamter Channel), sowie eine Funktion, z.B. "BatterieSpannung" für jeden entsprechenden Datenpunkt welcher die Batteriespannung des Gerätes anzeigt. **Aber hier nur für den Datenpunkt, nicht den gesamten Channel!!!**  
![batterienauswertungtut1.jpg](/admin/batterienauswertungtut1.jpg) 

# Installation
1. Wenn noch nicht geschehen, allen gewünschten Sensoren einen Raum und eine Funktion zuweisen. Die Funktion muss vorher in den Aufzählungen hinzugefügt werden und könnte z.B. "BatterieSpannung" lauten. Soll ein anderer Begriff verwendet werden, muss dies dann auch im Script, Zeile 10 geändert werden. **Nach der Zuweisung, bzw. dem anlegen neuer Aufzählungspunkte ist es oft hilfreich die JS Instanz neu zu starten da diese bei Aufzählungsänderungen gerne mal "zickt" was dann zu Skriptfehlern führt**.
2. Das Skript in ein neues JS Projekt kopieren.
3. Zeile 8-16 kontrollieren und bei Bedarf anpassen
4. Zeile 11-13 wäre der richtige Ort falls Telegram, Alexa etc. die Meldungen ausgeben sollen.
5. Skript starten
6. In den Objekten, unter Javascript.0.BatterieUeberwachung sollte es jetzt 4 Datenpunkte geben. Diese Datenpunkte könnt Ihr jetzt z.B. in Vis verwenden um Farbwechsel für Icons zu erstellen (AllBatteriesOk true/false), bzw. anzuzeigen welche Batterie gewechselt werden muß (LastMessage), bzw. welche Batterie vorrausichtlich als nächste leer wird, damit Ihr schon mal die richtige Neue besorgen könnt.

# Demo Widget für Vis
viswidget.txt ist ein kleines Demowidget welche die relevanten Infos des Skriptes visualisiert. Es zeigt links ein Batteriesymbol mit grünem Hintergrund, welcher bei Limitunterscheidung rot blinkt. Gleichzeitig wird die im grünen Zustand unsichtbare Lastmessage eingeblendet und blinkt ebenfalls rot. Immer sichtbar ist die Anzeige der vorrausichtlich nächsten Batterie welche leer wird, mit Raum und Geräteangabe. Das ganze ist nur EIN ganz normales String Widget. Es verwendet jedoch das Iconset "Mfd icons as SVG" welches installiert sein sollte, sonst fehlt das Batteriesymbol. Selbstverständlich könnt ihr aber auch andere, eigene Icons eintragen.  

![battok.png](/admin/battok.png) 
![battalarm1.png](/admin/battalarm1.png) 

# Changelog

#### 27.3.2020 (V 1.3.1)
* Change: Unterstriche in Raumnamen werden bei Ausgaben durch Leerzeichen ersetzt  
* Add: Bei Skriptstart werden nun alle deklarierten Geräte ausgegeben, sowie die Gesamtzahl dieser.
#### 26.3.2020 (V 1.3)
* Init  

