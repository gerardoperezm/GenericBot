'use strict';

// Cargar variables de ambiente
require('dotenv').config();

var https = require('https');

var host = 'api.cognitive.microsofttranslator.com';
var path = '/translate?api-version=3.0';
var subscriptionKey = process.env.TextTranslatorSubscriptionKey;
var defaultLanguage = process.env.TextTranslatorDefaultLanguage;
var userLanguage;

/**get_guid
 * Genera un string aleatorio
 */
function get_guid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0;
        var v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**translate
 * Detecta el idioma del mensaje y lo traduce al idioma deseado
 * @param language Idioma al que se quiere traducir el texto
 * @param content Texto que se quiere traducir
 */
function translate(language, content) {
    var request_params = {
        method: 'POST',
        hostname: host,
        path: path + '&to=' + language,
        headers: {
            'Content-Type': 'application/json',
            'Ocp-Apim-Subscription-Key': subscriptionKey,
            'X-ClientTraceId': get_guid()
        }
    };

    // Se genera una promesa para utilizar los resultados fuera de la funcion
    return new Promise((resolve, reject) => {
        var req = https.request(request_params, (response) => {
            var body = '';
            response.on('data', (d) => {
                body += d;
            });
            response.on('end', () => {
                var json = JSON.stringify(JSON.parse(body), null, 4);
                resolve( JSON.parse(body) );
            });

            response.on('error', (e) => {
                reject( { 'error': e.message } );
            });
        });

        req.write(content);
        req.end();
    });
}

module.exports = {

    /**toBot
     * Intercepta el mensaje ingresado por el usuario y
     * se llama la funcion "translate" con el idioma
     * por defecto del bot y el mensaje.
     */
    toBot: (session, next) => {
        var content = JSON.stringify([{ 'Text': session.message.text }]);

        translate(defaultLanguage, content)
            .then((data) => {
                userLanguage = data[0].detectedLanguage.language;
                if (defaultLanguage != userLanguage) {
                    session.message.text = data[0].translations[0].text;
                    session.save();
                }
                next();
            })
            .catch((error) => {
                console.log(error);
                next();
            });
    },

    /**toUser
     * Recive la respuesta del bot hacia el usuario y
     * se llama la funcion "translate" con el idioma
     * del usuario detectado previamente y el texto
     * de respuesta.
     */
    toUser: (event, next) => {
        var content = JSON.stringify([{ 'Text': event.text }]);

        translate(userLanguage, content)
            .then((data) => {
                event.text = data[0].translations[0].text;
                next();
            })
            .catch((error) => {
                console.log(error);
                next();
            });
    }

};