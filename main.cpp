#include <Arduino.h>
#include <WiFi.h>
#include <FirebaseESP32.h>

// WIFI
const char* ssid = "12";
const char* password = "05040522";
//const char* ssid = "Totalplay-5BB1";
//const char* password = "5BB13C41hajvn9Au";

// FIREBASE
#define FIREBASE_HOST "esp32-ecdcf-default-rtdb.asia-southeast1.firebasedatabase.app"
#define FIREBASE_AUTH "AIzaSyBTnfeDaDYQlk3ugUHzc3SXB_b7dMrv3Qg"

FirebaseData fbdo;
FirebaseConfig config;
FirebaseAuth auth;

// LEDS
int ledR[5] = {23, 4, 33, 27, 22};
int ledV[5] = {14, 18, 25, 26, 19};

// SENSORES
int sensores[5] = {34, 35, 32, 39, 36};
int umbral[5] = {2000, 2000, 2000, 2500, 2000};

int estadoAnterior[5] = {9,9,9,9,9};

int leerSensorEstable(int pin){
  int suma = 0;
  for(int i=0;i<3;i++){
    suma += analogRead(pin);
  }
  return suma / 3;
}

void setup() {
  Serial.begin(115200);

  for(int i=0;i<5;i++){
    pinMode(ledR[i], OUTPUT);
    pinMode(ledV[i], OUTPUT);
  }

  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(100);
    Serial.print(".");
  }
  Serial.println("\nWiFi conectado");

  config.host = FIREBASE_HOST;
  config.signer.tokens.legacy_token = FIREBASE_AUTH;

  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);

  Firebase.setwriteSizeLimit(fbdo, "small");
}

void loop() {

  int estados[5];

  // LEER SENSORES RÁPIDO Y ESTABLE
  for(int i=0;i<5;i++){
    int valor = leerSensorEstable(sensores[i]);
    estados[i] = (valor < umbral[i]) ? 0 : 1;

    digitalWrite(ledR[i], estados[i] == 0);
    digitalWrite(ledV[i], estados[i] == 1);
  }

  // DETECTAR CAMBIO GLOBAL
  bool cambio = false;
  for(int i=0;i<5;i++){
    if(estados[i] != estadoAnterior[i]){
      cambio = true;
      break;
    }
  }

  // ENVÍO EN BLOQUE (CLAVE)
  if(cambio && Firebase.ready()){

    FirebaseJson json;

    json.set("cajon1", estados[0]);
    json.set("cajon2", estados[1]);
    json.set("cajon3", estados[2]);
    json.set("cajon4", estados[3]);
    json.set("cajon5", estados[4]);

    if(Firebase.updateNode(fbdo, "/estacionamiento", json)){
      Serial.println("Actualización global");

      for(int i=0;i<5;i++){
        estadoAnterior[i] = estados[i];
      }

    }else{
      Serial.println(fbdo.errorReason());
    }

  }


} 
