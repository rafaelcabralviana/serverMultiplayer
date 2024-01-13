const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

// Armazena os objetos associados aos clientes usando o próprio codID como chave
const objetos = {};

// Lista para armazenar dados do usuário (nomeUser, codID e última coordenada)
const dadosUsuarios = [];

wss.on('connection', (ws, req) => {
  // Extrai o codID da URL da requisição
  const url = new URL(req.url, `http://${req.headers.host}`);
  const codID = url.searchParams.get('codID');
  const ip = req.socket.remoteAddress;

  console.log('Nova Conexão Cliente ID:', codID, ' IP:', ip);

  // Verifica se o codID está presente
  if (codID) {
    // Associa o objeto ao cliente usando o codID como chave
    objetos[codID] = { webSocket: ws };

    ws.on('message', (message) => {
      try {
        const dadosUsuario = JSON.parse(message);
        //console.log(dadosUsuario);
        // Atualiza a lista de dados do usuário
        const index = dadosUsuarios.findIndex((user) => user.codID === codID);
        if (index !== -1) {
          dadosUsuarios[index] = {
            nomeUser: dadosUsuario.nomeUser,
            codID: codID,
            ultimaCoordenada: { x: dadosUsuario.x, y: dadosUsuario.y, z: dadosUsuario.z },
            ultimaRotacao: { rotX: dadosUsuario.rotX, rotY: dadosUsuario.rotY, rotZ: dadosUsuario.rotZ },
          };
        } else {
          dadosUsuarios.push({
            nomeUser: dadosUsuario.nomeUser,
            codID: codID,
            ultimaCoordenada: { x: dadosUsuario.x, y: dadosUsuario.y, z: dadosUsuario.z },
            ultimaRotacao: { rotX: dadosUsuario.rotX, rotY: dadosUsuario.rotY, rotZ: dadosUsuario.rotZ },
          });
        }
        

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

    // Envia os dados do usuário para o novo cliente
    const dadosUsuarioAtualizados = JSON.stringify({
      //tipo: 'dadosUsuario',
      listaDadosUsuarios: dadosUsuarios,
    });

    ws.send(dadosUsuarioAtualizados);

    // Evento para tratar desconexão do cliente
    ws.on('close', (code, reason) => {
      console.log(`Cliente desconectado. ID: ${codID}`);

      // Remove os dados do usuário da lista ao se desconectar
      const index = dadosUsuarios.findIndex((user) => user.codID === codID);
      if (index !== -1) {
        dadosUsuarios.splice(index, 1);
      }

      // Envia uma mensagem informando a desconexão do cliente para todos os clientes
      const mensagemDesconexao = JSON.stringify({
        tipo: 'desconexao',
        codID: codID,
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
    console.error('URL da requisição não contém codID. Encerrando conexão.');
    ws.close(1002, 'URL da requisição não contém codID');
  }
});
