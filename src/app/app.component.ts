import { Component, OnInit, VERSION, ViewChild } from '@angular/core';
import {
  HubConnection,
  HubConnectionBuilder,
  IHttpConnectionOptions,
  LogLevel
} from '@microsoft/signalr';
import { HttpClient } from '@angular/common/http';
import { Chart } from 'chart.js';

export interface ISensorData {
  time: Date;
  temperature: number;
  humidity: number;
  pressure: number;
}

@Component({
  selector: 'my-app',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  name = 'Dashboard';
  private hubConnection: HubConnection;
  private signalrUrl: string;
  private accessToken: string;
  private data: Array<ISensorData> = [];

  public tempChart: Chart;
  public tempChartData: any = {};

  public pressureChart: Chart;
  public pressureChartData: any = {};

  public humidityChart: Chart;
  public humidityChartData: any = {};

  public constructor(private httpClient: HttpClient) {}

  public ngOnInit(): void {
    this.stopConnection();
    this.tempChartData = {
      labels: [],
      datasets: [
        {
          label: 'Temparature',
          data: [],
          borderColor: 'rgb(255, 159, 64)'
        }
      ]
    };
    this.pressureChartData = {
      labels: [],
      datasets: [
        {
          label: 'Pressure',
          data: [],
          borderColor: 'rgb(75, 192, 192)'
        }
      ]
    };
    this.humidityChartData = {
      labels: [],
      datasets: [
        {
          label: 'Flow rate',
          data: [],
          borderColor: 'rgb(153, 102, 255)'
        }
      ]
    };

    this.httpClient
      .post('https://r6functionapp.azurewebsites.net/api/negotiate', {})
      .subscribe((res: any) => {
        this.signalrUrl = res.url;
        this.accessToken = res.accessToken;

        this.hubConnection = this.createHubConnection(this.signalrUrl, {
          accessTokenFactory: () => {
            return this.accessToken;
          }
        });
        this.hubConnection.on('newMessage', message => {
          console.log(message);
          const sensorData: Array<ISensorData> = JSON.parse(message);
          this.data.push(sensorData[0]);
          const date: Date = new Date(sensorData[0].time);
          const time: string =
            date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
          this.addtempData(time, sensorData[0].temperature);
          this.addPressureData(time, sensorData[0].pressure);
          this.addHumidityData(time, sensorData[0].humidity);
        });

        this.hubConnection.start().catch(console.error);

        this.stopConnection();
      });
  }

  ngAfterViewInit() {
    this.tempChart = new Chart('canvas1', {
      type: 'line',
      data: this.tempChartData
    });

    this.pressureChart = new Chart('canvas2', {
      type: 'line',
      data: this.pressureChartData
    });

    this.humidityChart = new Chart('canvas3', {
      type: 'line',
      data: this.humidityChartData
    });
  }

  addtempData(label, data) {
    this.tempChart.data.labels.push(label);
    this.tempChart.data.datasets[0].data.push(data);
    console.log(this.tempChart.data);
    this.tempChart.update();
  }

  addPressureData(label, data) {
    this.pressureChart.data.labels.push(label);
    this.pressureChart.data.datasets[0].data.push(data);
    console.log(this.pressureChart.data);
    this.pressureChart.update();
  }

  addHumidityData(label, data) {
    this.humidityChart.data.labels.push(label);
    this.humidityChart.data.datasets[0].data.push(data);
    console.log(this.humidityChart.data);
    this.humidityChart.update();
  }

  private createHubConnection(
    url: string,
    connectionOptions?: IHttpConnectionOptions
  ): HubConnection {
    return new HubConnectionBuilder()
      .withUrl(url, connectionOptions)
      .configureLogging(LogLevel.Information)
      .build();
  }

  private stopConnection(): void {
    if (this.hubConnection && this.hubConnection.state === 'Connected') {
      this.hubConnection.stop();
    }
  }
}
