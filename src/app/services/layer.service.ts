import { Injectable } from '@angular/core';

import * as mapboxgl from 'mapbox-gl';

import { environment as env } from '../../environments/environment';
import { HttpService } from './http.service';
import { SensorService } from './sensor.service';
import { InteractionService } from './interaction.service';

@Injectable()
export class LayerService {
  map: mapboxgl.Map;

  constructor(
    private httpService: HttpService,
    private sensorService: SensorService,
    public interactionService: InteractionService
  ) { }

  initializeLayers(
    map: mapboxgl.Map,
    region: {
      name: string,
      code: string,
      bounds: {
        sw: number[],
        ne: number[]
      }
    }
  ): void {
    this.map = map;

    for (const layer of env.supportedLayers) {

      switch (layer.metadata.name) {
        case 'sensors':
          this.httpService
          .getGeometryData(layer.metadata, region.code)
          .then(geojson => {
            this.sensorService.updateProperties(geojson)
            .then(updatedSensors => {
              geojson.features = updatedSensors;
              layer.settings.source.data = geojson;

              // Add layer
              this.map.addLayer(layer.settings, layer.metadata['placeBelow']);
            })
            .catch(error => console.log(error));
          });
          break;

        default:
          this.httpService
          .getGeometryData(layer.metadata, region.code)
          .then(geojson => {
            // Overwrite data object
            layer.settings.source.data = geojson;
            // Add layer
            this.map.addLayer(layer.settings, layer.metadata['placeBelow']);

            this.addSelectionLayerInit(layer.settings, layer.metadata.selected, layer.metadata['placeBelow']);
          });
      }
    }
  }

  handleMapInteraction(
    event?: {
      type: string,
      lngLat: {
        lng: number,
        lat: number
      },
      point: {
        x: number,
        y: number
      },
      originalEvent: object,
      target: object
    }
  ) {
    if (event) {
      if (this.clearSelectionLayers(event.point)) {
        // CASE: Clicked over a previously selected feature
        // Deselect feature & exit function
        this.interactionService.handleLayerInteraction();

      } else {
        // Iterate over all layers
        for (const layer of env.supportedLayers) {
          const name = layer.metadata.name;
          const uniqueKey = layer.metadata.uniqueKey;
          let features = [];
          if (this.map.getLayer(name)) {
            features = this.map.queryRenderedFeatures(event.point, {layers: [name]});
          }

          if (features.length === 1) {
            // CASE: Clicked on a single feature
            this.modifyLayerFilter(name, uniqueKey, features);
            this.interactionService.handleLayerInteraction(name, features);
            break;

          } else if (features.length > 1) {
            // CASE: Clicked with multiple features overlapping
            // TODO: use clustering to show all features
            // Ref https://www.mapbox.com/mapbox-gl-js/example/cluster/
            this.interactionService.handleLayerInteraction(name, features);

            // FIXME: Fails when features from 2 different layers are overlapping
            // only first layer encountered is selected (report behind flood polygon case?)
            break;

          } else {
            // CASE: No feature found in layer being iterated over
            this.interactionService.handleLayerInteraction();
          }
        }
      }
    } else {
      // CASE: Clicked on Menu button,
      // non-map interaction event
      if (this.map) {
        this.clearSelectionLayers();
      }
      this.interactionService.handleLayerInteraction();
    }
  }

  clearSelectionLayers(
    point?: {
      x: number,
      y: number
    }
  ): boolean {
    let hasSelectedFeature = false;

    for (const layer of env.supportedLayers) {
      const layerName = layer.metadata.name;

      if (this.map.getLayer('sel' + layerName)) {
        // Check if a selection layer is active
        if (point) {
          hasSelectedFeature = (this.map.queryRenderedFeatures(point, {layers: ['sel' + layerName]})).length > 0;
        }

        // Restore base layer and selection layer filters
        this.modifyLayerFilter(layerName, null, null, true);
      }

      if (hasSelectedFeature) {
        return true;
      }
    }
  }

  addSelectionLayerInit(
    settings: any,
    selection: any,
    placeBelow: string
  ): void {
    const layerSettings: { [name: string]: any} = {};

    // modify settings of original layer
    layerSettings.id = 'sel' + settings.id;
    layerSettings.type = settings.type;
    layerSettings.source = settings.source;
    layerSettings[selection.type] = selection.style;

    const featureFilter = settings.filter.slice(-1).pop();
    featureFilter.splice(0, 1, '==');

    settings.filter.splice(-1, 1, featureFilter);
    layerSettings.filter = settings.filter;

    // add selected feature layer
    this.map.addLayer(layerSettings);
  }

  modifyLayerFilter(layerName: string, uniqueKey: string|null, features: any, restore?: boolean): void {
    // Get filter for queried layer
    const filter = this.map.getFilter(layerName);

    // Extract last item in filter array
    const featureFilter = filter.slice(-1).pop();

    let value = features[0].properties[uniqueKey];
    if (restore) {
      value = '';
    }

    // Replace 'value' item in ['operator', 'key', 'value'] array
    featureFilter.splice(-1, 1, value);
    // Replace featureFilter in queried layer filter
    filter.splice(-1, 1, featureFilter);

    // Update filter for base layer
    this.map.setFilter(layerName, filter);

    let operator = '==';
    if (restore) {
      operator = '!=';
    }

    // Invert 'operator'
    const selectionFilter = featureFilter;
    selectionFilter.splice(0, 1, operator);
    // Replace selectionFilter in queried layer's selection counterpart
    filter.splice(-1, 1, selectionFilter);

    // Update filter for selection layer
    this.map.setFilter('sel' + layerName, filter);
  }
}
