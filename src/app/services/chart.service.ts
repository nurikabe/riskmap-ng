import { Injectable } from '@angular/core';
import * as Chart from 'chart.js';

import { HttpService } from './http.service';
import { TimeService } from './time.service';

@Injectable()
export class ChartService {
  sensorData: {
    dataset_1: {y: number, t: string}[],
    dataset_2?: {y: number, t: string}[]
  };

  sensorChart: Chart;

  constructor(
    private httpService: HttpService,
    private timeService: TimeService
  ) { }

  parseData(sensor_id: number): Promise<boolean|null> {
    let hasUpstreamDownstream;

    return new Promise((resolve, reject) => {
      this.httpService.getJsonData('sensors', 'sensors/' + sensor_id)
      .then(data => {

        if (Array.isArray(data[0].properties.observations)) {
          hasUpstreamDownstream = false;
          this.sensorData = {
            dataset_1: []
          };

          for (const obs of data[0].properties.observations) {
            this.sensorData.dataset_1.push({
              y: parseFloat(obs.value),
              t: obs.dateTime.substring(0, 19)
            });
          }

          resolve(hasUpstreamDownstream);

        } else {
          hasUpstreamDownstream = true;
          const observations = data[0].properties.observations;
          this.sensorData = {
            dataset_1: [],
            dataset_2: []
          };

          for (const i in observations.upstream) {
            if (i) {
              this.sensorData.dataset_1.push({
                y: parseFloat(observations.upstream[i].value),
                t: observations.upstream[i].dateTime.substring(0, 19)
              });
              this.sensorData.dataset_2.push({
                y: parseFloat(observations.downstream[i].value),
                t: observations.downstream[i].dateTime.substring(0, 19)
              });
            }
          }

          resolve(hasUpstreamDownstream);
        }
      })
      .catch(error => reject(error));
    });
  }

  prepareCanvas(htmlElement) {
    // $('#foo').empty();
    while (htmlElement.firstChild) {
      htmlElement.removeChild(htmlElement.firstChild);
    }

    // $('#foo').html('<canvas id="chartInset"></canvas>');
    const canvasElement = document.createElement('canvas');
    canvasElement.setAttribute('id', 'chartInset');
    htmlElement.appendChild(canvasElement);

    const canvas = document.getElementById('chartInset');
    const chart_ctx = canvas['getContext']('2d');

    // chart_ctx.canvas.width = htmlElement.style.clientWidth;
    // chart_ctx.canvas.height = htmlElement.style.clientHeight;

    return chart_ctx;
  }

  prepareSensorChart() {
    const datasets = [];

    if (this.sensorData.hasOwnProperty('dataset_2')) {
      datasets.push(
        {
          label: 'Upstream',
          xAxisId: 'x1',
          yAxisId: 'y1',
          borderWidth: 1,
          borderColor: '#00ff00',
          backgroundColor: 'rgba(0, 0, 0, 0)',
          pointRadius: 0,
          data: this.sensorData.dataset_1,
        },
        {
          label: 'Downstream',
          xAxisId: 'x1',
          yAxisId: 'y1',
          borderWidth: 1,
          borderColor: '#0000ff',
          backgroundColor: 'rgba(0, 0, 0, 0)',
          pointRadius: 0,
          data: this.sensorData.dataset_2,
        }
      );
    } else {
      datasets.push(
        {
          label: '',
          xAxisId: 'x1',
          yAxisId: 'y1',
          borderWidth: 1,
          borderColor: '#ff0000',
          backgroundColor: 'rgba(0, 0, 0, 0)',
          pointRadius: 0,
          data: this.sensorData.dataset_1,
        }
      );
    }

    return {
      type: 'line',
      data: {
        datasets: datasets,
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        title: {
          display: false
        },
        legend: {
          display: true,
          position: 'top',
          labels: {
            fontColor: '#2f2f2f',
            fontFamily: '"Roboto-Medium", "Roboto", "Open Sans"'
          }
        },
        scales: {
          yAxes: [{
            id: 'y1',
            type: 'linear',
            position: 'left',
            ticks: {
              fontColor: '#2f2f2f',
              fontFamily: '"Roboto-Medium", "Roboto", "Open Sans"'
            }
          }],
          xAxes: [{
            id: 'x1',
            type: 'time',
            time: {
              unit: 'hour',
              unitStepSize: 1,
              displayFormats: {
                hour: 'HH:mm'
              },
              // FIXME: not working
              // parser: (time) => {
              //   return this.timeService.getLocalTime(time);
              // }
            },
            position: 'bottom',
            ticks: {
              autoSkip: true,
              autoSkipPadding: 12,
              fontColor: '#2f2f2f',
              fontFamily: '"Roboto Light", "Roboto", "Open Sans"'
            }
          }],
        }
      }
    };
  }

  drawSensorChart(htmlElement) {
    this.sensorChart = new Chart(
      this.prepareCanvas(htmlElement),
      this.prepareSensorChart()
    );
  }
}