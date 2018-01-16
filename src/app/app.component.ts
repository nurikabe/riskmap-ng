import { Component, Output, OnInit } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import mapboxgl from 'mapbox-gl';

import { environment as env } from '../environments/environment';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less']
})
export class AppComponent implements OnInit {
  param1 = {title: 'RiskMap', env: env.envName};
  param2 = {env: env.envName};
  param3 = {r: 3, h: 6};
  languages = env.locales.supportedLanguages;
  selectedRegion: {
    name: string,
    code: string,
    bounds: {
      sw: number[],
      ne: number[]
    }
  };

  @Output() map: mapboxgl.Map;
  // Use ngx-translate-messageformat-compiler for pluralization, etc

  constructor(
    private translate: TranslateService,
    private route: ActivatedRoute
  ) {
    // this language will be used as a fallback when a translation isn't found in the current language
    this.translate.setDefaultLang(env.locales.defaultLanguage);
    // the lang to use, if the lang isn't available, it will use the current loader to get them
    this.translate.use(env.locales.defaultLanguage);
  }

  changeLanguage(event) {
    const lang = event.srcElement.value;
    this.translate.use(lang);
  }

  ngOnInit() {
    // Ref https://alligator.io/angular/query-parameters/
    // for navigation with & accessing query params
    this.route.queryParams.subscribe((params: Params) => {
      for (const region of env.instances.regions) {
        if (params['region'] === region.name) {
          this.selectedRegion = region;
          console.log('code: ' + this.selectedRegion.code);
          break;
        } else {
          console.log('show selection popup');
        }
      }
    });

    const self = this;
    mapboxgl.accessToken = env.map.accessToken;
    self.map = new mapboxgl.Map({
      attributionControl: false,
      container: 'mapWrapper',
      center: env.map.center,
      zoom: env.map.initZoom,
      minZoom: env.map.minZoom,
      style: env.map.baseMapStyle,
      hash: false,
      preserveDrawingBuffer: true
    });

    self.map.on('style.load', () => {
      // Do stuff
    });
  }
}
