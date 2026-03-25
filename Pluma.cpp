#include <Arduino.h>
#include <WiFi.h>
#include <FirebaseESP32.h>
#include <ESP32Servo.h>

// WIFI
const char* ssid = "Wokwi-GUEST";
const char* password = "";

// FIREBASE
#define FIREBASE_HOST "estacionamientouanl-default-rtdb.firebaseio.com"
#define FIREBASE_AUTH "AIzaSyDTEJ3mfhPKsC2gsp4VNutoCcZ-4naQNTs"

FirebaseData fbdo;
FirebaseConfig config;
FirebaseAuth auth;

// ===== SERVOS =====
Servo servoEntrada;
Servo servoSalida;

const int pinServoEntrada = 13;
const int pinServoSalida = 12; // puedes cambiarlo si quieres

// ===== SENSORES =====
const int pinSensorEntrada = 34;
const int pinSensorSalida = 35;

int umbralPresion = 1500;

void setup() {
  Serial.begin(115200);

  // Configurar PWM
  ESP32PWM::allocateTimer(0);
  ESP32PWM::allocateTimer(1);

  // Servo Entrada
  servoEntrada.setPeriodHertz(50);
  servoEntrada.attach(pinServoEntrada, 500, 2400);
  servoEntrada.write(0);

  // Servo Salida
  servoSalida.setPeriodHertz(50);
  servoSalida.attach(pinServoSalida, 500, 2400);
  servoSalida.write(0);

  // WiFi
  WiFi.begin(ssid, password);
  Serial.print("Conectando WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi Conectado");

  // Firebase
  config.host = FIREBASE_HOST;
  config.signer.tokens.legacy_token = FIREBASE_AUTH;

  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);
}

void loop() {

  // ===== LECTURA SENSORES =====
  int valorEntrada = analogRead(pinSensorEntrada);
  int estadoEntrada = (valorEntrada > umbralPresion) ? 1 : 0;

  int valorSalida = analogRead(pinSensorSalida);
  int estadoSalida = (valorSalida > umbralPresion) ? 1 : 0;

  // ===== ENVIAR A FIREBASE =====
  Firebase.setInt(fbdo, "/estacionamiento/sensor_entrada", estadoEntrada);
  Firebase.setInt(fbdo, "/estacionamiento/sensor_salida", estadoSalida);

  // ===== LEER CONTROL =====
  int plumaEntradaDB = 0;
  int plumaSalidaDB = 0;

  if (Firebase.getInt(fbdo, "/estacionamiento/pluma_entrada")) {
    plumaEntradaDB = fbdo.intData();
  }

  if (Firebase.getInt(fbdo, "/estacionamiento/pluma_salida")) {
    plumaSalidaDB = fbdo.intData();
  }

  // ===== LÓGICA ENTRADA =====
  if (plumaEntradaDB == 1) {

    if (estadoEntrada == 1) {
      Serial.println("ENTRADA → CARRO DETECTADO");

      servoEntrada.write(90);

      while (analogRead(pinSensorEntrada) > umbralPresion) {
        delay(100);
      }

      Serial.println("ENTRADA → CARRO SE FUE");

      servoEntrada.write(0);
    }

    Firebase.setInt(fbdo, "/estacionamiento/pluma_entrada", 0);
  }

  // ===== LÓGICA SALIDA =====
  if (plumaSalidaDB == 1) {

    if (estadoSalida == 1) {
      Serial.println("SALIDA → CARRO DETECTADO");

      servoSalida.write(90);

      while (analogRead(pinSensorSalida) > umbralPresion) {
        delay(100);
      }

      Serial.println("SALIDA → CARRO SE FUE");

      servoSalida.write(0);
    }

    Firebase.setInt(fbdo, "/estacionamiento/pluma_salida", 0);
  }

  delay(200);
}
