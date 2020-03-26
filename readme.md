# Script um die Batteriestände beliebig vieler Geräte mit gleichem LowLimit zu überwachen

#### Kann beliebige Geräte überwachen welche einen Datenpunkt mit der Batteriespannung zur Verfügung stellen.
#### Legt vier Datenpunkte an (Summenfeld - AllBatterysOk, Einstellfeld für die LimitSpannung - BatteryMinLimit, die letzte ausgegene Nachricht - LastMessage, sowie Raum und Gerät der Batterie mit aktuell niedrigsten Stand - NextExpectedLowBatt).
#### Möglichkeit eine Meldung/Ansage via Log/Alexa/Telegram auszugeben

# WICHTIG!!!
### Vorraussetzungen: Den Geräten müssen Räume zugewiesen sein (gesamter Channel), sowie eine Funktion, z.B. "BatterieSpannung" für jeden entsprechenden Datenpunkt welcher die Batteriespannung des Gerätes anzeigt. **Aber hier nur für den Datenpunkt, nicht den gesamten Channel!!!**
![batterienauswertungtut1.jpg](/admin/batterienauswertungtut1.jpg) 

# Installation
1. Wenn noch nicht geschehen, allen gewünschten Sensoren einen Raum und eine Funktion zuweisen. Die Funktion muss vorher in den Aufzählungen hinzugefügt werden und könnte z.B. "BatterieSpannung" lauten. Soll ein anderer Begriff verwendet werden, muss dies dann auch im Script, Zeile 10 geändert werden.
2. Das Skript in ein neues JS Projekt kopieren.
3. Zeile 8-16 kontrollieren und bei Bedarf anpassen
4. Zeile 11-13 wäre der richtige Ort falls Telegram, Alexa etc. die Meldungen ausgeben sollen.
5. Skript starten
6. In den Objekten, unter Javascript.0.BatterieUeberwachung sollte es jetzt 4 Datenpunkte geben. Diese Datenpunkte könnt Ihr jetzt z.B. in Vis verwenden um Farbwechsel für Icons zu erstellen (AllBatteriesOk true/false), bzw. anzuzeigen welche Batterie gewechselt werden muß (LastMessage), bzw. welche Batterie vorrausichtlich als nächste leer wird, damit Ihr schon mal die richtige Neue besorgen könnt.

# Changelog

#### 26.3.20 Init  

