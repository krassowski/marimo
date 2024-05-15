/* Copyright 2024 Marimo. All rights reserved. */
import { TopLevelSpec } from "vega-lite";
import { Marks } from "./marks";
import {
  Field,
  Mark,
  SelectionParameter,
  SingleDefUnitChannel,
  VegaLiteUnitSpec,
} from "./types";
import { LayerSpec, UnitSpec } from "vega-lite/build/src/spec";

const ParamNames = {
  point(layerNum: number | undefined) {
    return layerNum == null ? "select_point" : `select_point_${layerNum}`;
  },
  interval(layerNum: number | undefined) {
    return layerNum == null ? "select_interval" : `select_interval_${layerNum}`;
  },
  legendSelection(field: string) {
    return `legend_selection_${field}`;
  },
  HIGHLIGHT: "highlight",
};

export const Params = {
  highlight() {
    return {
      name: ParamNames.HIGHLIGHT,
      select: { type: "point", on: "mouseover" },
    };
  },
  interval(
    spec: VegaLiteUnitSpec,
    layerNum: number | undefined,
  ): SelectionParameter<"interval"> {
    return {
      name: ParamNames.interval(layerNum),
      select: {
        type: "interval",
        encodings: getEncodingAxisForMark(spec),
        mark: {
          fill: "#669EFF",
          fillOpacity: 0.07,
          stroke: "#669EFF",
          strokeOpacity: 0.4,
        },
      },
    };
  },
  point(
    spec: VegaLiteUnitSpec,
    layerNum: number | undefined,
  ): SelectionParameter<"point"> {
    return {
      name: ParamNames.point(layerNum),
      select: {
        type: "point",
        encodings: getEncodingAxisForMark(spec),
      },
    };
  },
  legend(field: string): SelectionParameter<"point"> {
    return {
      name: ParamNames.legendSelection(field),
      select: {
        type: "point",
        fields: [field],
      },
      bind: "legend",
    };
  },
};

export function getEncodingAxisForMark(
  spec: VegaLiteUnitSpec,
): SingleDefUnitChannel[] | undefined {
  const mark = Marks.getMarkType(spec.mark);
  switch (mark) {
    case Mark.image:
    case Mark.trail:
      return undefined;
    case Mark.area:
    case Mark.arc:
      return ["color"];
    case Mark.bar: {
      const direction = getDirectionOfBar(spec);
      return direction === "horizontal"
        ? ["y"]
        : direction === "vertical"
          ? ["x"]
          : undefined;
    }
    case Mark.circle:
    case Mark.geoshape:
    case Mark.line:
    case Mark.point:
    case Mark.rect:
    case Mark.rule:
    case Mark.square:
    case Mark.text:
    case Mark.tick:
      return ["x", "y"];
  }
}

export function getSelectionParamNames(
  spec: TopLevelSpec | LayerSpec<Field> | UnitSpec<Field>,
): string[] {
  if ("params" in spec && spec.params && spec.params.length > 0) {
    const params = spec.params;
    return (
      params
        // @ts-expect-error TS doesn't know that `param` is an object
        .filter((param) => {
          if (param == null) {
            return false;
          }
          // @ts-expect-error TS doesn't know that `param` is an object
          return "select" in param && param.select !== undefined;
        })
        .map((param) => param.name)
    );
  }
  if ("layer" in spec) {
    return [...new Set(spec.layer.flatMap(getSelectionParamNames))];
  }
  return [];
}

/**
 * Returns the direction of the bar chart.
 */
export function getDirectionOfBar(
  spec: VegaLiteUnitSpec,
): "horizontal" | "vertical" | undefined {
  if (!spec || !("mark" in spec)) {
    return undefined;
  }

  const xEncoding = spec.encoding?.x;
  const yEncoding = spec.encoding?.y;

  if (xEncoding && "type" in xEncoding && xEncoding.type === "nominal") {
    return "vertical";
  }

  if (yEncoding && "type" in yEncoding && yEncoding.type === "nominal") {
    return "horizontal";
  }

  if (xEncoding && "aggregate" in xEncoding) {
    return "horizontal";
  }

  if (yEncoding && "aggregate" in yEncoding) {
    return "vertical";
  }

  return undefined;
}
