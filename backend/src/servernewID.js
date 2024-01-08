const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

// Armazena os objetos associados aos clientes usando o próprio codID como chave
const objetos = {};

wss.on('connection', (ws, req) => {
  //console.log('Novo cliente conectado');
  
  // Extrai o codID da URL da requisição
  const url = new URL(req.url, `http://${req.headers.host}`);
  const codID = url.searchParams.get('codID');

  // Verifica se o codID está presente
  if (codID) {
    // Associa o objeto ao cliente usando o codID como chave
    objetos[codID] = { webSocket: ws };

    ws.on('message', (message) => {
      try {
        const dadosUsuario = JSON.parse(message);
        console.log('Coordenadas recebidas:', dadosUsuario);

        // Repassa a mensagem para todos os clientes conectados
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(message);
          }
        });
      } catch (error) {
        console.error('Erro ao analisar as coordenadas:', error);
      }
    });

    // Evento para tratar desconexão do cliente
    ws.on('close', (code, reason) => {
      console.log(`Cliente desconectado. CodID: ${codID}`);

      // Envia uma mensagem informando a desconexão do cliente para todos os clientes
      const mensagemDesconexao = JSON.stringify({
        tipo: 'desconexao',
        codID: codID
      });

      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(mensagemDesconexao);
        }
      });

    });

    ws.on('error', (error) => {
      console.error('Erro WebSocket:', error);
    });
  } else {
    //console.error('URL da requisição não contém codID. Encerrando conexão.');
    //ws.close(1002, 'URL da requisição não contém codID');
  }
});
