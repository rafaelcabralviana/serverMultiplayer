const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
  console.log('Novo cliente conectado');

  ws.on('message', (message) => {
    //console.log('Mensagem recebida do cliente:', message);

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

  ws.on('error', (error) => {
    console.error('Erro WebSocket:', error);
  });
});
