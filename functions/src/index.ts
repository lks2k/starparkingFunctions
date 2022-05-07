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
    pagamento: boolean,
    data: string,
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
  if (p.placa.length != 8) {
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

/** *
 * Retorna a mensagem
 * @param {Placa} p - Teste
 * @return {number} - Retorna uma mensagem...
 */
function validarRegularidade(p: Placa) : number {
  if (p.placa.length != 8) {
    return 1;
  }
  if (!p.placa) {
    return 2;
  }
  return 0;
}

/** *
 * Retorna a mensagem
 * @param {number} cod - Teste
 * @return {string} - Retorna uma mensagem...
 */
function erroRegularizar(cod: number) : string {
  let msg = "";
  switch (cod) {
    case 1: {
      msg = "Placa inválida";
      break;
    }
    case 2: {
      msg = "O valor inserido não é uma placa";
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
        pagamento: false,
        data: data.data,
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


export const ChecarStatus = functions
    .region("southamerica-east1")
    .https.onCall(async (data, context) => {
      let resultado: CallableResponse;
      functions.logger.info("checarPagamentoVeículos - iniciada.");

      const p = data.placa as string;
      const pagamentoVeiculo : Placa[] = [];
      const snapshot = await db.collection("Pagamentos")
          .where("placa", "==", p).where("pagamento", "==", true).get();
      let tempPlaca: Placa;
      snapshot.forEach((doc) => {
        const d = doc.data();
        tempPlaca = {
          placa: d.placa,
          pagamento: d.pagamento,
          data: d.data,
        };
        pagamentoVeiculo.push(tempPlaca);
      });

      const placa = {
        placa: data.placa,
        pagamento: data.pagamento,
        data: data.data,
      };

      const codErro = validarRegularidade(placa);
      const msgErro = erroRegularizar(codErro);

      if (codErro > 0) {
        codErro.toString(),

        resultado = {
          status: "ERRO",
          message: msgErro,
          payload: JSON.parse(JSON.stringify("null")),
        };
      } else {
        if (pagamentoVeiculo.length <= 0) {
          const pagamentoValidado = "Veículo irregular";
          resultado = {
            status: "SUCESSO",
            message: "Consulta realizada, este veículo está irregular",
            payload: JSON.parse(JSON.stringify(pagamentoValidado)),
          };
        } else {
          const pagamentoValidado = "Veículo regular";
          resultado = {
            status: "SUCESSO",
            message: "Consulta realizada, este veículo está regular",
            payload: JSON.parse(JSON.stringify(pagamentoValidado)),
          };
        }
      }
      return resultado;
    });
