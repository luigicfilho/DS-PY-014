class PerceptronVisualizer {
      constructor() {
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.points = [];
        this.currentClass = 1;
        this.weights = [Math.random() * 2 - 1, Math.random() * 2 - 1];
        this.bias = Math.random() * 2 - 1;
        this.learningRate = 0.1;
        this.training = false;
        this.paused = false;
        this.epoch = 0;
        this.currentPoint = 0;
        this.maxEpochs = 10;
        this.trainingTimeout = null;
        
        this.setupEventListeners();
        this.updateDisplay();
      }

      setupEventListeners() {
        this.canvas.addEventListener('click', (e) => this.addPoint(e));
        this.canvas.addEventListener('mousemove', (e) => this.showTooltip(e));
        this.canvas.addEventListener('mouseleave', () => this.hideTooltip());
      }

      addPoint(e) {
        if (this.training && !this.paused) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (this.canvas.width / rect.width);
        const y = (e.clientY - rect.top) * (this.canvas.height / rect.height);
        
        this.points.push({ x, y, label: this.currentClass });
        this.redraw();
        this.updateStats();
        this.setStatus(`Ponto ${this.currentClass === 1 ? 'vermelho' : 'azul'} adicionado! Total: ${this.points.length} pontos.`);
      }

      showTooltip(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (this.canvas.width / rect.width);
        const y = (e.clientY - rect.top) * (this.canvas.height / rect.height);
        
        const tooltip = document.getElementById('tooltip');
        const prediction = this.predict([x / this.canvas.width, y / this.canvas.height]);
        
        tooltip.innerHTML = `Posição: (${Math.round(x)}, ${Math.round(y)})<br>Predição: ${prediction === 1 ? 'Vermelho' : 'Azul'}`;
        tooltip.style.left = e.clientX + 10 + 'px';
        tooltip.style.top = e.clientY - 10 + 'px';
        tooltip.classList.add('show');
      }

      hideTooltip() {
        document.getElementById('tooltip').classList.remove('show');
      }

      predict(input) {
        const sum = input[0] * this.weights[0] + input[1] * this.weights[1] + this.bias;
        return sum >= 0 ? 1 : -1;
      }

      calculateAccuracy() {
        if (this.points.length === 0) return 0;
        
        let correct = 0;
        for (const point of this.points) {
          const input = [point.x / this.canvas.width, point.y / this.canvas.height];
          const prediction = this.predict(input);
          if (prediction === point.label) correct++;
        }
        
        return Math.round((correct / this.points.length) * 100);
      }

      drawPoint(x, y, label, highlight = false, pointInfo = null) {
        this.ctx.save();
        
        if (highlight) {
          // Animação pulsante
          const time = Date.now() * 0.005;
          const pulse = Math.sin(time) * 0.3 + 1;
          
          // Efeito de destaque com pulso
          this.ctx.beginPath();
          this.ctx.arc(x, y, 15 * pulse, 0, Math.PI * 2);
          this.ctx.fillStyle = 'rgba(251, 191, 36, 0.2)';
          this.ctx.fill();
          
          this.ctx.beginPath();
          this.ctx.arc(x, y, 15, 0, Math.PI * 2);
          this.ctx.strokeStyle = '#fbbf24';
          this.ctx.lineWidth = 3;
          this.ctx.stroke();
          
          // Desenhar legenda do ponto em treinamento
          if (pointInfo) {
            this.drawPointLegend(x, y, pointInfo);
          }
        }
        
        this.ctx.beginPath();
        this.ctx.arc(x, y, highlight ? 8 : 6, 0, Math.PI * 2);
        this.ctx.fillStyle = label === 1 ? '#ef4444' : '#3b82f6';
        this.ctx.fill();
        
        this.ctx.beginPath();
        this.ctx.arc(x, y, highlight ? 8 : 6, 0, Math.PI * 2);
        this.ctx.strokeStyle = 'white';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        this.ctx.restore();
      }

      drawPointLegend(x, y, info) {
        this.ctx.save();
        
        // Calcular posição do balão para não sair da tela
        let balloonX = x + 30;
        let balloonY = y - 60;
        
        // Ajustar se sair da tela
        if (balloonX + 180 > this.canvas.width) {
          balloonX = x - 210;
        }
        if (balloonY < 20) {
          balloonY = y + 30;
        }
        
        // Sombra do balão
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        this.ctx.fillRect(balloonX + 2, balloonY + 2, 180, 90);
        
        // Fundo do balão
        this.ctx.fillStyle = 'white';
        this.ctx.strokeStyle = info.isCorrect ? '#22c55e' : '#ef4444';
        this.ctx.lineWidth = 2;
        this.ctx.fillRect(balloonX, balloonY, 180, 90);
        this.ctx.strokeRect(balloonX, balloonY, 180, 90);
        
        // Linha conectora (seta)
        this.ctx.beginPath();
        this.ctx.moveTo(x + (balloonX > x ? 15 : -15), y);
        this.ctx.lineTo(balloonX + (balloonX > x ? 0 : 180), balloonY + 45);
        this.ctx.strokeStyle = '#94a3b8';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // Triângulo da seta
        const arrowX = balloonX + (balloonX > x ? -8 : 188);
        const arrowY = balloonY + 45;
        this.ctx.beginPath();
        this.ctx.moveTo(arrowX, arrowY - 6);
        this.ctx.lineTo(arrowX + (balloonX > x ? -8 : 8), arrowY);
        this.ctx.lineTo(arrowX, arrowY + 6);
        this.ctx.closePath();
        this.ctx.fillStyle = '#94a3b8';
        this.ctx.fill();
        
        // Texto do balão
        this.ctx.fillStyle = '#1f2937';
        this.ctx.font = 'bold 14px Segoe UI';
        this.ctx.fillText('CALCULANDO:', balloonX + 8, balloonY + 18);
        
        this.ctx.font = '12px Segoe UI';
        this.ctx.fillStyle = '#374151';
        
        // Informações do cálculo
        const lines = [
          `Posição: (${Math.round(info.x)}, ${Math.round(info.y)})`,
          `Entrada: (${info.normalizedX}, ${info.normalizedY})`,
          `Saída: ${info.output} ${info.output === 1 ? '(Vermelho)' : '(Azul)'}`,
          `Real: ${info.actual} ${info.actual === 1 ? '(Vermelho)' : '(Azul)'}`,
          `${info.isCorrect ? 'CORRETO!' : `ERRO: ${info.error}`}`
        ];
        
        lines.forEach((line, index) => {
          if (index === 4) { // Última linha com resultado
            this.ctx.fillStyle = info.isCorrect ? '#22c55e' : '#ef4444';
            this.ctx.font = 'bold 12px Segoe UI';
          }
          this.ctx.fillText(line, balloonX + 8, balloonY + 35 + (index * 12));
        });
        
        this.ctx.restore();
      }

      drawDecisionBoundary() {
        // Verificar se os pesos são válidos para desenhar a linha
        if (Math.abs(this.weights[1]) < 0.001 && Math.abs(this.weights[0]) < 0.001) {
          return; // Não desenhar se ambos os pesos são muito pequenos
        }
        
        this.ctx.save();
        
        let x1, y1, x2, y2;
        
        // Estratégia para garantir que a linha seja sempre visível
        if (Math.abs(this.weights[1]) > Math.abs(this.weights[0])) {
          // Se w1 (peso Y) for maior, calcular baseado em X fixo
          x1 = 0;
          y1 = -(this.weights[0] * (x1 / this.canvas.width) + this.bias) / this.weights[1] * this.canvas.height;
          x2 = this.canvas.width;
          y2 = -(this.weights[0] * (x2 / this.canvas.width) + this.bias) / this.weights[1] * this.canvas.height;
          
          // Se os pontos Y saírem muito da tela, recalcular baseado em Y fixo
          if ((y1 < -100 || y1 > this.canvas.height + 100) && 
              (y2 < -100 || y2 > this.canvas.height + 100)) {
            x1 = -(this.weights[1] * (0 / this.canvas.height) + this.bias) / this.weights[0] * this.canvas.width;
            y1 = 0;
            x2 = -(this.weights[1] * (this.canvas.height / this.canvas.height) + this.bias) / this.weights[0] * this.canvas.width;
            y2 = this.canvas.height;
          }
        } else {
          // Se w0 (peso X) for maior, calcular baseado em Y fixo
          x1 = -(this.weights[1] * (0 / this.canvas.height) + this.bias) / this.weights[0] * this.canvas.width;
          y1 = 0;
          x2 = -(this.weights[1] * (this.canvas.height / this.canvas.height) + this.bias) / this.weights[0] * this.canvas.width;
          y2 = this.canvas.height;
          
          // Se os pontos X saírem muito da tela, recalcular baseado em X fixo
          if ((x1 < -100 || x1 > this.canvas.width + 100) && 
              (x2 < -100 || x2 > this.canvas.width + 100)) {
            x1 = 0;
            y1 = -(this.weights[0] * (x1 / this.canvas.width) + this.bias) / this.weights[1] * this.canvas.height;
            x2 = this.canvas.width;
            y2 = -(this.weights[0] * (x2 / this.canvas.width) + this.bias) / this.weights[1] * this.canvas.height;
          }
        }
        
        // Garantir que pelo menos parte da linha seja visível
        // Se ambos os pontos estão fora, tentar encontrar intersecções com as bordas
        if ((x1 < 0 && x2 < 0) || (x1 > this.canvas.width && x2 > this.canvas.width) ||
            (y1 < 0 && y2 < 0) || (y1 > this.canvas.height && y2 > this.canvas.height)) {
          
          // Encontrar intersecções com as bordas do canvas
          const intersections = [];
          
          // Intersecção com borda esquerda (x = 0)
          const yLeft = -(this.weights[0] * 0 + this.bias) / this.weights[1] * this.canvas.height;
          if (yLeft >= 0 && yLeft <= this.canvas.height) {
            intersections.push({x: 0, y: yLeft});
          }
          
          // Intersecção com borda direita (x = canvas.width)
          const yRight = -(this.weights[0] * 1 + this.bias) / this.weights[1] * this.canvas.height;
          if (yRight >= 0 && yRight <= this.canvas.height) {
            intersections.push({x: this.canvas.width, y: yRight});
          }
          
          // Intersecção com borda superior (y = 0)
          const xTop = -(this.weights[1] * 0 + this.bias) / this.weights[0] * this.canvas.width;
          if (xTop >= 0 && xTop <= this.canvas.width) {
            intersections.push({x: xTop, y: 0});
          }
          
          // Intersecção com borda inferior (y = canvas.height)
          const xBottom = -(this.weights[1] * 1 + this.bias) / this.weights[0] * this.canvas.width;
          if (xBottom >= 0 && xBottom <= this.canvas.width) {
            intersections.push({x: xBottom, y: this.canvas.height});
          }
          
          // Usar as duas primeiras intersecções válidas
          if (intersections.length >= 2) {
            x1 = intersections[0].x;
            y1 = intersections[0].y;
            x2 = intersections[1].x;
            y2 = intersections[1].y;
          }
        }
        
        // Desenhar a linha com cor verde e estilo destacado
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        
        // Linha principal verde
        this.ctx.strokeStyle = '#22c55e';
        this.ctx.lineWidth = 4;
        this.ctx.stroke();
        
        // Contorno para melhor visibilidade
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.strokeStyle = '#166534';
        this.ctx.lineWidth = 6;
        this.ctx.globalAlpha = 0.3;
        this.ctx.stroke();
        this.ctx.globalAlpha = 1;
        
        // Desenhar pequenas setas para indicar direção
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        const angle = Math.atan2(y2 - y1, x2 - x1);
        
        // Seta 1
        this.ctx.save();
        this.ctx.translate(midX - 30, midY - 30);
        this.ctx.rotate(angle);
        this.ctx.beginPath();
        this.ctx.moveTo(0, 0);
        this.ctx.lineTo(-8, -4);
        this.ctx.lineTo(-8, 4);
        this.ctx.closePath();
        this.ctx.fillStyle = '#22c55e';
        this.ctx.fill();
        this.ctx.restore();
        
        // Seta 2
        this.ctx.save();
        this.ctx.translate(midX + 30, midY + 30);
        this.ctx.rotate(angle);
        this.ctx.beginPath();
        this.ctx.moveTo(0, 0);
        this.ctx.lineTo(-8, -4);
        this.ctx.lineTo(-8, 4);
        this.ctx.closePath();
        this.ctx.fillStyle = '#22c55e';
        this.ctx.fill();
        this.ctx.restore();
        
        this.ctx.restore();
      }

      redraw(highlightIndex = -1, pointInfo = null) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Desenhar grade sutil
        this.ctx.save();
        this.ctx.strokeStyle = '#f1f5f9';
        this.ctx.lineWidth = 1;
        for (let i = 0; i <= 10; i++) {
          const x = (i / 10) * this.canvas.width;
          const y = (i / 10) * this.canvas.height;
          this.ctx.beginPath();
          this.ctx.moveTo(x, 0);
          this.ctx.lineTo(x, this.canvas.height);
          this.ctx.stroke();
          this.ctx.beginPath();
          this.ctx.moveTo(0, y);
          this.ctx.lineTo(this.canvas.width, y);
          this.ctx.stroke();
        }
        this.ctx.restore();
        
        this.drawDecisionBoundary();
        
        this.points.forEach((point, index) => {
          const isHighlighted = index === highlightIndex;
          const info = isHighlighted ? pointInfo : null;
          this.drawPoint(point.x, point.y, point.label, isHighlighted, info);
        });
      }

      updateDisplay() {
        document.getElementById('weight1').textContent = this.weights[0].toFixed(3);
        document.getElementById('weight2').textContent = this.weights[1].toFixed(3);
        document.getElementById('biasValue').textContent = this.bias.toFixed(3);
      }

      updateStats() {
        document.getElementById('totalPoints').textContent = this.points.length;
        const accuracy = this.calculateAccuracy();
        document.getElementById('accuracy').textContent = accuracy + '%';
      }

      updateProgress() {
        const totalSteps = this.maxEpochs * this.points.length;
        const currentStep = this.epoch * this.points.length + this.currentPoint;
        const progress = totalSteps > 0 ? (currentStep / totalSteps) * 100 : 0;
        
        document.getElementById('progressFill').style.width = progress + '%';
        document.getElementById('progressText').textContent = `${currentStep}/${totalSteps}`;
      }

      setStatus(message, isError = false) {
        const statusEl = document.getElementById('statusMessage');
        statusEl.innerHTML = message;
        statusEl.className = isError ? 'error' : '';
        statusEl.classList.add('slide-in');
        setTimeout(() => statusEl.classList.remove('slide-in'), 300);
      }

      startTraining() {
        if (this.points.length === 0) {
          this.setStatus('Adicione pelo menos um ponto antes de treinar!', true);
          return;
        }

        this.training = true;
        this.paused = false;
        this.epoch = 0;
        this.currentPoint = 0;
        
        document.getElementById('trainBtn').disabled = true;
        document.getElementById('pauseBtn').disabled = false;
        document.getElementById('classBtn').disabled = true;
        
        // Adicionar efeito visual ao canvas durante treinamento
        this.canvas.classList.add('training-active');
        
        this.setStatus(`Iniciando treinamento... (${this.maxEpochs} épocas)<br><small>Observe o balão de informações no ponto sendo calculado!</small>`);
        this.trainStep();
      }

      pauseTraining() {
        this.paused = !this.paused;
        const pauseBtn = document.getElementById('pauseBtn');
        
        if (this.paused) {
          pauseBtn.innerHTML = 'Continuar';
          this.setStatus('Treinamento pausado');
          if (this.trainingTimeout) {
            clearTimeout(this.trainingTimeout);
          }
        } else {
          pauseBtn.innerHTML = 'Pausar';
          this.setStatus('Continuando treinamento...');
          this.trainStep();
        }
      }

      trainStep() {
        if (!this.training || this.paused) return;

        if (this.epoch >= this.maxEpochs) {
          this.finishTraining();
          return;
        }

        const point = this.points[this.currentPoint];
        const input = [point.x / this.canvas.width, point.y / this.canvas.height];
        const output = this.predict(input);
        const error = point.label - output;
        const isCorrect = error === 0;

        // Informações detalhadas para o balão no gráfico
        const pointInfo = {
          x: point.x,
          y: point.y,
          normalizedX: input[0].toFixed(3),
          normalizedY: input[1].toFixed(3),
          output: output,
          actual: point.label,
          error: error,
          isCorrect: isCorrect
        };

        let statusMessage = `<strong>Época ${this.epoch + 1}/${this.maxEpochs} - Ponto ${this.currentPoint + 1}/${this.points.length}</strong><br>`;
        statusMessage += `<div style="background: #f8fafc; padding: 8px; border-radius: 6px; margin: 8px 0;">`;
        statusMessage += `<strong>Calculando:</strong> (${Math.round(point.x)}, ${Math.round(point.y)})<br>`;
        statusMessage += `<strong>Entrada normalizada:</strong> (${input[0].toFixed(3)}, ${input[1].toFixed(3)})<br>`;
        statusMessage += `<strong>Soma ponderada:</strong> ${(input[0] * this.weights[0] + input[1] * this.weights[1] + this.bias).toFixed(3)}<br>`;
        statusMessage += `<strong>Saída:</strong> ${output} (${output === 1 ? 'Vermelho' : 'Azul'})<br>`;
        statusMessage += `<strong>Classe real:</strong> ${point.label} (${point.label === 1 ? 'Vermelho' : 'Azul'})<br>`;
        statusMessage += `</div>`;

        if (error !== 0) {
          const oldWeights = [...this.weights];
          const oldBias = this.bias;
          
          this.weights[0] += error * input[0] * this.learningRate;
          this.weights[1] += error * input[1] * this.learningRate;
          this.bias += error * this.learningRate;
          
          statusMessage += `<div style="background: #fef2f2; padding: 8px; border-radius: 6px; border-left: 3px solid #ef4444;">`;
          statusMessage += `<strong>ERRO: ${error}</strong> - Ajustando parâmetros:<br>`;
          statusMessage += `<small>W₁: ${oldWeights[0].toFixed(3)} → <span class="highlight">${this.weights[0].toFixed(3)}</span><br>`;
          statusMessage += `W₂: ${oldWeights[1].toFixed(3)} → <span class="highlight">${this.weights[1].toFixed(3)}</span><br>`;
          statusMessage += `Bias: ${oldBias.toFixed(3)} → <span class="highlight">${this.bias.toFixed(3)}</span></small>`;
          statusMessage += `</div>`;
        } else {
          statusMessage += `<div style="background: #f0fdf4; padding: 8px; border-radius: 6px; border-left: 3px solid #22c55e;">`;
          statusMessage += `<strong>CORRETO!</strong> Nenhum ajuste necessário`;
          statusMessage += `</div>`;
        }

        this.setStatus(statusMessage);
        this.updateDisplay();
        this.updateStats();
        this.updateProgress();
        this.redraw(this.currentPoint, pointInfo);

        this.currentPoint++;
        if (this.currentPoint >= this.points.length) {
          this.currentPoint = 0;
          this.epoch++;
        }

        this.trainingTimeout = setTimeout(() => this.trainStep(), 2000); // Aumentado para dar tempo de ler
      }

      finishTraining() {
        this.training = false;
        this.paused = false;
        
        document.getElementById('trainBtn').disabled = false;
        document.getElementById('pauseBtn').disabled = true;
        document.getElementById('pauseBtn').innerHTML = 'Pausar';
        document.getElementById('classBtn').disabled = false;
        
        // Remover efeito visual do canvas
        this.canvas.classList.remove('training-active');
        
        const accuracy = this.calculateAccuracy();
        this.setStatus(`Treinamento concluído!<br>Precisão final: <span class="highlight">${accuracy}%</span><br><small>A linha verde representa a fronteira de decisão aprendida.</small>`);
        this.redraw(); // Sem destaque no ponto
        this.updateProgress();
      }

      toggleClass() {
        if (this.training && !this.paused) return;
        
        this.currentClass *= -1;
        const label = this.currentClass === 1 ? 'Vermelha' : 'Azul';
        document.getElementById('classLabel').textContent = label;
        this.setStatus(`Classe alterada para: <span class="highlight">${label}</span>`);
      }

      reset() {
        this.training = false;
        this.paused = false;
        this.points = [];
        this.weights = [Math.random() * 2 - 1, Math.random() * 2 - 1];
        this.bias = Math.random() * 2 - 1;
        this.epoch = 0;
        this.currentPoint = 0;
        
        if (this.trainingTimeout) {
          clearTimeout(this.trainingTimeout);
        }
        
        document.getElementById('trainBtn').disabled = false;
        document.getElementById('pauseBtn').disabled = true;
        document.getElementById('pauseBtn').innerHTML = 'Pausar';
        document.getElementById('classBtn').disabled = false;
        document.getElementById('progressFill').style.width = '0%';
        document.getElementById('progressText').textContent = '0/0';
        
        this.redraw();
        this.updateDisplay();
        this.updateStats();
        this.setStatus('Sistema resetado! Adicione novos pontos para começar.');
      }
    }

// Funções globais para compatibilidade
let perceptron;

function toggleClass() {
  perceptron.toggleClass();
}

function startTraining() {
  perceptron.startTraining();
}

function pauseTraining() {
  perceptron.pauseTraining();
}

function resetCanvas() {
  perceptron.reset();
}

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
  perceptron = new PerceptronVisualizer();
});
