import { Component, EventEmitter, Input, Output, OnInit, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { SensorInterface } from '../../interfaces';

@Component({
  selector: 'app-site-info',
  templateUrl: './site-info.component.html',
  styleUrls: ['./site-info.component.scss']
})
export class SiteInfoComponent implements OnInit, OnChanges, OnDestroy {
  @Input() stations: {
    [name: string]: any
  }[];
  @Input() site;
  @Input() map;

  features: SensorInterface[];
  sfwmdIconMap = {
    H: 'headwater',
    T: 'tailwater',
    S: 'spillway',
    W: 'weir',
    C: 'discharge',
    P: 'pump'
  };

  @Output() closePanel = new EventEmitter<null>();

  constructor() { }

  ngOnInit() {
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.hasOwnProperty('site')) {
      this.features = [];
      const siteStations = [];
      const allStations = this.map.getSource('sensors_sfwmd')._data.features;

      // NOTE: Cannot use map.querySourceFeatures OR map.queryRenderedFeatures
      // since sensors_sfwmd will not visible when user clicks on a site feature;
      // https://www.mapbox.com/mapbox-gl-js/api#map#queryrenderedfeatures

      // Iterate over station names
      for (const selectedSiteStation of this.stations) {
        // Store filtered features from sensors_sfwmd layer
        siteStations.push(allStations.filter((station) => {
          return selectedSiteStation.stationId === station.properties.stationId;
        })[0]);
      }

      for (const station of siteStations) {
        this.features.push([{
          layer: {id: 'sensors_sfwmd'},
          properties: station.properties,
          supressChartTitles: true
        }]);
      }
    }
  }

  ngOnDestroy() {
    // clear?
  }
}
