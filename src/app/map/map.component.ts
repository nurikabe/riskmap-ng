import { Component, Output, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import * as mapboxgl from 'mapbox-gl';
import { MatDialog } from '@angular/material';
import 'rxjs/add/operator/skip';

import { environment as env } from '../../environments/environment';
import { LayerService } from '../services/layer.service';
import { ScreenPopupComponent } from './screen-popup/screen-popup.component';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements OnInit {
  param1 = {title: 'RiskMap', env: env.envName};
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
    private router: Router,
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private translate: TranslateService,
    public layerService: LayerService
  ) {
    // this language will be used as a fallback when a translation isn't found in the current language
    this.translate.setDefaultLang(env.locales.defaultLanguage);
    // the lang to use, if the lang isn't available, it will use the current loader to get them
    this.translate.use(env.locales.defaultLanguage);
  }

  changeLanguage(event): void {
    this.translate.use(event.value);
  }

  ngOnInit() {
    // skip accessing queryParams on first init
    // https://stackoverflow.com/questions/47430727/angular-queryparammap-is-empty-then-populated
    this.route.queryParams.subscribe((params: Params) => {
      let hasRegionParam = false;

      for (const region of env.instances.regions) {
        if (params['region'] === region.name) {
          this.selectedRegion = region;
          hasRegionParam = true;
          break;
        }
      }

      if (!hasRegionParam) {
        this.openDialog();
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
      // Do stuff here
      if (self.selectedRegion) {
        self.layerService.initializeLayers(self.selectedRegion);
      }
    });
  }

  openDialog(): void {
    const dialogRef = this.dialog.open(ScreenPopupComponent, {
      width: '320px',
      data: env.instances.regions
    });

    dialogRef.afterClosed().subscribe(result => {
      this.selectedRegion = result;
      // TODO: either navigate or trigger regionChange process
      this.router.navigate([''], {queryParams: {region: result.name}});
    });
  }
}
