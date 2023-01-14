const SignalResult = require('../dict/signal_result');

module.exports = class {
  getName() {
    return 'scalping';
  }

  buildIndicator(indicatorBuilder, options) {
    indicatorBuilder.add('psar', 'psar', options.period);
    indicatorBuilder.add('heikin_ashi', 'heikin_ashi', options.period);
    indicatorBuilder.add('rsi', 'rsi', options.period, {
      length: 14,
      source: 'close'
    });
    indicatorBuilder.add('ema200', 'ema', options.period, {
      length: 200,
      source: 'close'
    });
  }

  async period(indicatorPeriod, options) {
    // This function handles Candles Data
    const currentValues = indicatorPeriod.getLatestIndicators();

    const emptySignal = SignalResult.createEmptySignal(currentValues);
    const candles = indicatorPeriod.getLatestIndicator('candles');
    const heikinAshi = indicatorPeriod.getLatestIndicator('heikin_ashi');
    const ema = indicatorPeriod.getLatestIndicator('ema200');
    const rsi = indicatorPeriod.getLatestIndicator('rsi');
    const psar = indicatorPeriod.getLatestIndicator('psar');

    const candleValues = indicatorPeriod.getIndicator('heikin_ashi');
    const previousCandleValues = candleValues[candleValues.length - 4];
    const psarValues = indicatorPeriod.getIndicator('psar');
    const previousPsar = psarValues[psarValues.length - 4];
    // console.log({ previousPsar, previousCandleValues });
    // console.log({ time: new Date(heikinAshi.time * 1000), candles, heikinAshi, ema, rsi, psar });

    const lastSignal = indicatorPeriod.getLastSignal();

    // Add Debug Value
    emptySignal.addDebug('ema', ema);
    emptySignal.addDebug('psar', psar);
    emptySignal.addDebug('rsi', rsi);
    emptySignal.addDebug('candle', heikinAshi);

    // Buy or Long Order
    const isNoTailAtBottom = heikinAshi.open === heikinAshi.low;
    const isPreviousCandlePsarAtTop = previousCandleValues?.close < previousPsar;
    const isCurrentCandlePsarAtBottom = heikinAshi.open > psar;
    if (
      heikinAshi.open > ema &&
      rsi > 50 &&
      isNoTailAtBottom &&
      isPreviousCandlePsarAtTop &&
      isCurrentCandlePsarAtBottom &&
      (!lastSignal || lastSignal === 'close')
    ) {
      emptySignal.setSignal('long');
    }

    // Close Buy Order

    if (lastSignal === 'long' && heikinAshi.close < psar) {
      emptySignal.setSignal('close');
    }

    // Sell or Short Order
    const isNoTailAtTop = heikinAshi.open === heikinAshi.high;
    const isPreviousCandlePsarAtBottom = previousCandleValues?.close > previousPsar;
    const isCurrentCandlePsarAtTop = heikinAshi.open < psar;
    if ((!lastSignal || lastSignal === 'close') && isNoTailAtTop && rsi < 50 && isPreviousCandlePsarAtBottom && isCurrentCandlePsarAtTop) {
      emptySignal.setSignal('short');
    }
    // Close Sell Order

    if (lastSignal === 'short' && heikinAshi.close > psar) {
      emptySignal.setSignal('close');
    }
    // const candles1m = indicatorPeriod.getIndicator('candles_1m');
    // if (!candles1m) {
    //   return result;
    // }

    // const candles3m = resample.resampleMinutes(candles1m.slice().reverse(), '3');

    // const foo = TechnicalAnalysis.getPivotPoints(
    //   candles1m.slice(-10).map(c => c.close),
    //   3,
    //   3
    // );

    // const bb = indicatorPeriod.getLatestIndicator('bb');

    // const lastCandle = candles1m.slice(-1)[0];
    // result.addDebug('price2', lastCandle.close);

    // if (bb && lastCandle && lastCandle.close > bb.upper) {
    //   result.addDebug('v', 'success');

    //   const bb = indicatorPeriod.getIndicator('bb');

    //   const values = bb
    //     .slice(-10)
    //     .reverse()
    //     .map(b => b.width);
    //   const value = Math.min(...values);

    //   if (currentValues.bb.width < 0.05) {
    //     result.addDebug('x', currentValues.bb.width);
    //     result.setSignal('long');
    //   }
    // }

    // result.addDebug('pivot', foo);

    // result.mergeDebug(TechnicalPattern.volumePump(candles3m.slice().reverse() || []));

    return emptySignal;
  }

  getBacktestColumns() {
    return [
      {
        label: 'RSI',
        value: 'rsi'
      },
      {
        label: 'EMA',
        value: 'ema'
      },
      {
        label: 'PSAR',
        value: 'psar'
      },
      {
        label: 'Heikin Ashi',
        value: 'candle'
      }
    ];
  }

  getOptions() {
    return {
      period: '5m',
      high: [],
      low: [],
      step: 0.02,
      max: 0.2
    };
  }
};
