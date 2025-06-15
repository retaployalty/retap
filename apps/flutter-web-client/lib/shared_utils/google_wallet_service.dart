import 'package:googleapis/walletobjects/v1.dart' as wallet;
import 'package:googleapis_auth/auth_io.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:jwt_decoder/jwt_decoder.dart';
import 'package:crypto/crypto.dart';

class GoogleWalletService {
  static const String _issuerId = '3388000000022918092';
  static const String _serviceAccountEmail = 'retap-wallet-212@retap-460215.iam.gserviceaccount.com';
  static const String _privateKey = '''-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDekvbfNZt7p4gx
VzrWBHdWFCIk4m0J65M9HzROKRFZTdK9IwCKiQsD4db6vqqHKbMfTvtN1MmAJfUb
e6dsH1Us922PlmMwhBq/nEGWCEcujyq8iujDK8Bprxr01Ye0GoKaSA3t7PBTkha6
5yt7tEb2YVyjosaxYjLQsGwyjQ8aJDTVR8Lh3y/+a4PZ/Wd74WwD+/akuHUgXWFv
6KzDmRe1Kye+sDS3F0KG/nZFHxKhkK9FW4T8ZbiIdxC41jlpxc7z6+UC3l3MVWnn
jaZDTFxeN9VqfL+v2ub0WYvJu6bgRkQmdwDOFfCA0Isug9tcSRYUXwT4MG3mzwlZ
MBB/HslBAgMBAAECggEABOWCPO0ONQZNmjKIW8xKiu43pbSlpARiw3NQ8nvfvt19
9olPQBT5jRfoK6EzgaSJrU1+vMayycT4AV8vItNGA6akOl6bUzZCS4MovBgFtx75
IG+MxSuslJSgouiSTxx+0V2mwQxjiX6hHXKzzal8vsuLuvm8HduWeSnq8PIijhNZ
pZhFejk2lV08nrunhKM2FT9rtjFoHxZmZBML5qDmYPZe6wV6VB483TMYqzm7jYoF
UzR3kJ4pVC4BMDRnWbW17oWUr+9zk3ctN7Ju3P7OJ7AdN7NjYHXkoU+piUlBuhD0
gGuoaJCVhVzpKP+uDc2ML4jgaPc45/tZqNUiBBSRoQKBgQDvQNOLv2IYMckBHAIy
wjHrz55f6+C8ou2DZ4ye21/+huXbQSuNA1PE/T3iWu9DF9xeXvujXbLkZXZ1FPSw
sHQqHJpvJ3Id7CS9Ar6P35x5dgUPfWPDPelpyNzpS3intkd4T0+ZF0aSMdMyno4o
mDtlfd2OvRyMseYNfIhPYaTgYQKBgQDuJ0PBxQrldX8sg+eCBbNj3n5MyagHgR+A
/ypZFUC0TsqqiwrMlX6tvVcFSLQ7EVQ8nkGaqMYMNldldAvIevwzxHS6xkkTB4CM
sH3G/qpWtZzxI5KQ/mkUmKOE8cn3Y3KL614DLqV+bDXHEF+w8BS6QXpDj3SPiFP3
G4f1om4U4QKBgGiKTuUVLuubdVTCxEMhj2aWRYFsM7q5BkcQi+UtvfgdQXpYM4te
FNBSRyQMz9blKikiH5n2ayBZJTVrfq9lqpxr+x7ugXKJqFPeSx3aeyinZPart1es
Sb0rQzu8+m9tujTbktA112Qx2TKZDUy3l9x07sZb44mmgfsKmxT0eXKBAoGBANzv
okVeRniPI3cpu5l9LmpFHAiiv/aOTKrAjgns1IUx34SNz2vyeH43/EYTp9hwgCRo
cNZJIsprk3K0UMYhil2AMQahM2Oq/xAGH/l/golEnR98b9mBm/yWioSoR0Txhm/V
3/a1zKRXQSC2yP9+CsysN//7UxhhUfwaF2zCzrshAoGBAIHlnR0NXNCPZvW17MnF
9ZcKzkjGPT1AsWsrEU0n5+7Eg7WCBkOC4nk7dEIHpgDD1r4F5rLwYimpBGUyrTnx
bgXcMc/NC84FVcIwygUgbdepC9AfFJ998X1CFlhDB5ALszZ9q6Dr4DhWDF3478v9
8xN9xjWMYEUFHCSu0S9lPfA5
-----END PRIVATE KEY-----''';

  static Future<wallet.WalletobjectsApi> _getWalletApi() async {
    final credentials = ServiceAccountCredentials.fromJson({
      "type": "service_account",
      "project_id": "retap-460215",
      "private_key_id": "3be4fed613691c1bfdae290fc499c8b2be84697e",
      "private_key": _privateKey,
      "client_email": _serviceAccountEmail,
      "client_id": "101881625879357914024",
      "auth_uri": "https://accounts.google.com/o/oauth2/auth",
      "token_uri": "https://oauth2.googleapis.com/token",
      "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
      "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/retap-wallet-212%40retap-460215.iam.gserviceaccount.com",
      "universe_domain": "googleapis.com"
    });

    final scopes = [wallet.WalletobjectsApi.walletObjectIssuerScope];
    final client = await clientViaServiceAccount(credentials, scopes);
    return wallet.WalletobjectsApi(client);
  }

  static String _signJwt(String data) {
    final key = utf8.encode(_privateKey);
    final bytes = utf8.encode(data);
    final hmac = Hmac(sha256, key);
    final digest = hmac.convert(bytes);
    return base64Url.encode(digest.bytes);
  }

  static String _generateJwt(String objectId) {
    final now = DateTime.now().millisecondsSinceEpoch ~/ 1000;
    final jwt = {
      'iss': _serviceAccountEmail,
      'aud': 'google',
      'origins': ['retap.it'],
      'typ': 'savetowallet',
      'payload': {
        'loyaltyObjects': [
          {
            'id': objectId
          }
        ]
      },
      'iat': now,
      'exp': now + 3600, // 1 ora di validità
    };

    final header = {
      'alg': 'RS256',
      'typ': 'JWT',
      'kid': '3be4fed613691c1bfdae290fc499c8b2be84697e'
    };

    final encodedHeader = base64Url.encode(utf8.encode(json.encode(header)));
    final encodedPayload = base64Url.encode(utf8.encode(json.encode(jwt)));
    
    final dataToSign = '$encodedHeader.$encodedPayload';
    final signature = _signJwt(dataToSign);
    
    return '$encodedHeader.$encodedPayload.$signature';
  }

  static Future<String> createLoyaltyCard({
    required String cardId,
    required String customerName,
    required String cardUid,
  }) async {
    try {
      print('Inizializzazione API...');
      final api = await _getWalletApi();
      print('API inizializzata');

      print('Creazione classe pass...');
      // Crea la classe del pass
      final passClass = wallet.LoyaltyClass(
        id: '$_issuerId.retap_loyalty',
        issuerName: 'ReTap',
        programName: 'ReTap Loyalty',
        programLogo: wallet.Image(
          sourceUri: wallet.ImageUri(
            uri: 'https://retap.it/logo.png',
          ),
        ),
        reviewStatus: 'APPROVED',
        allowMultipleUsersPerObject: false,
        locations: [
          wallet.LatLongPoint(
            latitude: 45.4642,
            longitude: 9.1900,
            kind: 'walletobjects#latLongPoint',
          ),
        ],
        textModulesData: [
          wallet.TextModuleData(
            header: 'PROGRAM',
            body: 'ReTap Loyalty Program',
            id: 'program',
          ),
        ],
      );

      // Crea o aggiorna la classe
      try {
        print('Verifica classe esistente...');
        await api.loyaltyclass.get('$_issuerId.retap_loyalty');
        print('Classe esistente trovata');
      } catch (e) {
        print('Creazione nuova classe...');
        final classResponse = await api.loyaltyclass.insert(passClass);
        print('Classe creata con successo: ${classResponse.id}');
      }

      print('Creazione pass...');
      // Crea il pass
      final pass = wallet.LoyaltyObject(
        id: '$_issuerId.$cardId',
        classId: '$_issuerId.retap_loyalty',
        state: 'ACTIVE',
        heroImage: wallet.Image(
          sourceUri: wallet.ImageUri(
            uri: 'https://retap.it/hero.png',
          ),
        ),
        textModulesData: [
          wallet.TextModuleData(
            header: 'NAME',
            body: customerName,
            id: 'name',
          ),
          wallet.TextModuleData(
            header: 'CARD ID',
            body: cardId,
            id: 'card_id',
          ),
        ],
        barcode: wallet.Barcode(
          type: 'QR_CODE',
          value: jsonEncode({
            'type': 'retap_card',
            'id': cardId,
            'uid': cardUid,
          }),
          alternateText: cardId,
        ),
        accountId: cardId,
        accountName: customerName,
      );

      // Crea o aggiorna il pass
      print('Inserimento pass...');
      String objectId;
      try {
        // Prova prima a ottenere il pass esistente
        final existingPass = await api.loyaltyobject.get('$_issuerId.$cardId');
        print('Pass esistente trovato, aggiornamento...');
        // Se esiste, aggiornalo
        final response = await api.loyaltyobject.update(pass, '$_issuerId.$cardId');
        objectId = response.id!;
        print('Pass aggiornato con successo: $objectId');
      } catch (e) {
        // Se non esiste, crealo
        print('Pass non trovato, creazione nuovo...');
        final response = await api.loyaltyobject.insert(pass);
        objectId = response.id!;
        print('Pass creato con successo: $objectId');
      }

      // Genera il JWT e il link per aggiungere il pass al wallet
      final jwt = _generateJwt(objectId);
      final saveUrl = 'https://pay.google.com/gp/v/save/$jwt';
      print('URL generato: $saveUrl');
      return saveUrl;
    } catch (e) {
      print('Errore dettagliato: $e');
      throw Exception('Errore nella creazione del pass: $e');
    }
  }
} 