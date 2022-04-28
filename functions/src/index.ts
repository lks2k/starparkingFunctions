import * as functions from "firebase-functions";
import * as admin from "firebase-admin";


admin.initializeApp();
const db = admin.firestore();

interface CallableResponse {
    status: string,
    message: string,
    payload: JSON
}


interface Placa {
    placa: string,
    data: string,
    horaDeEntrada: string,
    horaDeSaida: string
}


/**
 * Exemplo de validação na entrada. Complemente com as regras que achar
 * importante.
 * @param {Placa} p - Objeto produto a ser validado.
 * @return {number} - Retorna 0 se válido ou o código de erro.
 **/
function analizarPlaca(p: Placa): number {
  if (!p.placa) {
    return 1;
  }
  if (p.placa.length > 8) {
    return 2;
  }
  return 0;
}

/** *
 * Retorna a mensagem
 * @param {number} cod - Teste
 * @return {string} - Retorna uma mensagem...
 */
function getMensagemErro(cod: number) : string {
  let msg = "";
  switch (cod) {
    case 1: {
      msg = "Placa não informada.";
      break;
    }
    case 2: {
      msg = "Placa incorreta.";
      break;
    }
  }
  return msg;
}


export const addNewPlaca = functions
    .region("southamerica-east1")
    .https.onCall(async (data, context) => {
      let result: CallableResponse;

      const placa = {
        placa: data.placa,
        data: data.data,
        horaDeEntrada: data.horaDeEntrada,
        horaDeSaida: data.horaDeSaida,
      };

      const codErro = analizarPlaca(placa);
      const msgErro = getMensagemErro(codErro);

      if (codErro > 0) {
        functions.logger.error("addNewPlaca " + "- Erro ao inserir placa: " +
          codErro.toString()),

        result = {
          status: "ERROR",
          message: msgErro,
          payload: JSON.parse(JSON.stringify({docId: null})),
        };
        console.log(result);
      } else {
        const docRef = await db.collection("Pagamentos").add(placa);
        result = {
          status: "SUCESSO",
          message: "Placa inserida com sucesso",
          payload: JSON.parse(JSON.stringify({docId: docRef.id.toString()})),
        };
        functions.logger.error("addNewPlaca - Placa inserida.");
      }
      return result;
    });


export const getPlaca = functions
    .region("southamerica-east1")
    .https.onCall(async (data, context) => {
      const p = data.placa as string;
      const placas: Placa[] = [];
      const snapshot = await db.collection("Pagamentos")
          .where("placa", "==", p).get();
      let tempPlaca: Placa;
      snapshot.forEach((doc) => {
        const d = doc.data();
        tempPlaca = {
          placa: d.placa,
          data: d.data,
          horaDeEntrada: d.horaDeEntrada,
          horaDeSaida: d.horaDeSaida,
        };
        placas.push(tempPlaca);
      });
      return placas;
    });


