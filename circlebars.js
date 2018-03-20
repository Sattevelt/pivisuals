var CircleBars = function() {
    this.getDefaultOptions = function() {
        return {
            "digitSpacing": 15,
            "subDigitSpacing": 30,
            "radii":  [0.05, 0.35, 0.36, 0.40, 0.41, 0.98], // Radius distances from the center (100 is max distance)
            "palette": [
                '#0F425A', // Index 0 - 9 represent colors for digits 0-9
                '#32A4E7',
                '#4D7719',
                '#46CF64',
                '#690404',
                '#E70F19',
                '#945200',
                '#E36903',
                '#3F1E4E',
                '#8C51C3',
                '#000000' // BG color
            ],
            "strokeColor": "#fff",
            "strokeWidth": 0.001,
            "width": 1400,
            "height": 900
        };
    };

    this.render = function (canvasElem, options) {
        // calculate distrbutions
        var distributions = this.getDistributions(piDigits, 1, 100);

        // Prepare canvas
        canvasElem.width = options.width;
        canvasElem.height = options.height;
        var context = canvasElem.getContext('2d');
        context.fillStyle = options.palette[10];
        context.fillRect(0, 0, canvasElem.width, canvasElem.height);

        // Translate radii
        var smallestDimension = Math.min(options.width, options.height);
        options.radiiTranslated = [];
        for (var i in options.radii) {
            options.radiiTranslated[i] = options.radii[i] * (smallestDimension / 2);
        }

        this.drawDistribution(
            distributions,
            canvasElem,
            options
        );
    };

    this.drawDistribution = function (distributions, canvas, options) {
        var radii = options.radiiTranslated;
        var context = canvas.getContext('2d');
        var singleDigitSpacing = options.digitSpacing / 1000;
        var singleDigitWidth = (1 - (options.digitSpacing / 100)) / 10;

        var singleSubDigitSpacing = options.subDigitSpacing / 900;
        var singleSubDigitWidth =  (1 - (options.subDigitSpacing / 100)) / 10;

        var arcDistanceDigit = 2 * Math.PI * singleDigitWidth;
        var arcDistanceSpacing = 2 * Math.PI * singleDigitSpacing;

        var arcDistanceSubDigit = arcDistanceDigit * singleSubDigitWidth;
        var arcDistanceSubSpacing = arcDistanceDigit * singleSubDigitSpacing;

        context.translate(canvas.width/2, canvas.height/2);
        context.strokeStyle = options.strokeColor;
        context.lineWidth = options.strokeWidth;
        context.imageSmoothingQuality = "high";
        context.imageSmoothingEnabled = true;

        for (var curDigit = 0; curDigit < 10; curDigit++) {
            var startAngle = (arcDistanceDigit + arcDistanceSpacing) * curDigit;
            var endAngle = startAngle + arcDistanceDigit;
            context.fillStyle = options.palette[curDigit];
            this.drawArcedRectangle(context, startAngle, endAngle, radii[2], radii[3]);
            var subStartAngle = startAngle;

            for (var subDigit = 0; subDigit < 10; subDigit++) {
                var value = this.convertRange(distributions[curDigit].out[subDigit], 1, 100, radii[4], radii[5]);
                context.fillStyle = options.palette[subDigit];
                this.drawArcedRectangle(context, subStartAngle, subStartAngle + arcDistanceSubDigit, radii[4], value);

                value = this.convertRange(distributions[curDigit].in[subDigit], 1, 100, radii[1], radii[0]);
                this.drawArcedRectangle(context, subStartAngle, subStartAngle + arcDistanceSubDigit, radii[1], value);

                subStartAngle += arcDistanceSubDigit + arcDistanceSubSpacing;
            }
        }
    };

    this.drawArcedRectangle = function(context, startAngle, endAngle, startRadius, endRadius) {
        var point1 = this.getPointByAngleAndRadius(startAngle, startRadius);
        var point2 = this.getPointByAngleAndRadius(startAngle, endRadius);
        var point4 = this.getPointByAngleAndRadius(endAngle, startRadius);

        context.beginPath();
        context.moveTo(point1.x, point1.y);
        context.lineTo(point2.x, point2.y);
        context.arc(0, 0, endRadius, startAngle, endAngle);
        context.lineTo(point4.x, point4.y);
        context.arc(0, 0, startRadius, endAngle, startAngle, true);
        context.fill();
        context.stroke();
    };

    this.getPointByAngleAndRadius = function (angle, radius) {
        return {
            x: Math.cos(angle) * radius,
            y: Math.sin(angle) * radius
        };
    };

    this.getDistributions = function(piDigits, minValue, maxValue) {
        // Set up structure
        var distributions = [];
        for (var i = 0; i < 10; i++) {
            distributions[i] = {"in": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], "out": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]};
        }

        // Get distributions
        var prevDigit = piDigits[0];
        var counter = 0;
        for (i = 1; i < piDigits.length; i++) {

            var curDigit = piDigits[i];
            distributions[prevDigit].out[curDigit]++;
            distributions[curDigit].in[prevDigit]++;

            prevDigit = curDigit;
            counter++;
        }

        // Get extremes
        var curMaxValue = 0;
        var curMinValue = piDigits.length;
        for (var k = 0; k < 10; k++) {
            for (var l = 0; l < 10; l++) {
                var curValue = distributions[k].in[l];
                curMaxValue = Math.max(curMaxValue, curValue);
                curMinValue = Math.min(curMinValue, curValue);
            }
        }

        // normalize all values to range minValue-maxValue
        for (k = 0; k < 10; k++) {
            for (l = 0; l < 10; l++) {
                distributions[k].in[l] = Math.round(
                    this.convertRange(distributions[k].in[l], curMinValue, curMaxValue, minValue, maxValue)
                );
                distributions[k].out[l] = Math.round(
                    this.convertRange(distributions[k].out[l], curMinValue, curMaxValue, minValue, maxValue)
                );
            }
        }

        return distributions;
    };
    this.convertRange = function (value, oldMin, oldMax, newMin, newMax) {
        var oldRange = (oldMax - oldMin);
        var newRange = (newMax - newMin);
        return (((value - oldMin) * newRange) / oldRange) + newMin;
    }
};
