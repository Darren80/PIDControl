import { log } from "console";

class PID {
    // Constructor: initialize gain factors for P, I, D control, error values and target and current states
    constructor(proportionalGain, integralGain, derivativeGain, outputLowerLimit = -100, outputUpperLimit = 100) {
        this.proportionalGain = proportionalGain;
        this.integralGain = integralGain;
        this.derivativeGain = derivativeGain;

        this.proportionalTerm = 0;
        this.integralTerm = 0;
        this.derivativeTerm = 0;
        this.totalTerm = 0;

        // LP Filter for derivative term
        this.filterConstant = 0.1;
        this.filteredDerivative = 0;

        this._setpoint = 0;

        this.processVariable = 0;
        this.previousProcessVariable = 0;

        this.integralAccumulator = 0;

        // Timekeeping variables
        // Time-series
        this.lastUpdateTime = Date.now(); // Time of last update
        this.deltaTime = 0.01; // Time since last update

        this.currentError = 0;
        this.previousError = 0;

        // Output limits
        this.outputLowerLimit = outputLowerLimit;
        this.outputUpperLimit = outputUpperLimit;

        // Timekeeping for chart
        this.lastChartUpdateTime = Date.now();
        // Data for chart
        this.proportionalErrorData = [];
        this.integralErrorData = [];
        this.derivativeErrorData = [];
        this.processVariableData = [];
        this.totalTermData = [];
        this.acceleration = 0;
        this.accelerationData = [];
    }

    set setpoint(newSetpoint) {
        this._setpoint = newSetpoint;
        this.currentError = newSetpoint;
        this.previousError = newSetpoint;
    }


    // Main method to run PID control
    run() {
        // Calculate error terms
        this.calcProportionalError();
        this.calcIntegralError();
        this.calcDerivativeError();

        // Combine errors to obtain net output
        this.totalTerm = this.proportionalTerm + this.integralTerm + this.derivativeTerm;
        // Clamp output to limits
        // Integrator anti-windup in event of output saturation
        if (this.totalTerm > this.outputUpperLimit) {
            this.backCalculateIntegralError();
        } else if (this.totalTerm < this.outputLowerLimit) {
            this.backCalculateIntegralError();
        }

        // Update chart data every x ms
        if (Date.now() - this.lastChartUpdateTime > 200) {
            this.updateChartData();
            this.lastChartUpdateTime = Date.now();
        }

        // Log values for debug
        console.log("Setpoint: " + this._setpoint + " | Process Variable: " + this.processVariable.toFixed(3) + "\tProportional Error: " + this.proportionalTerm.toFixed(3) + " Integral Error: " + this.integralTerm.toFixed(3) + " Derivative Error: " + this.derivativeTerm.toFixed(3) + " Total Error: " + this.totalTerm.toFixed(3));

        // Return net error for use in control application
        return this.totalTerm;
    }

    // Setter for current value, also updates past value
    // run() should be called right after this to update the error values.
    set currentVal(newProcessVariable) {

        // Update timekeeping variables
        let currentTime = Date.now();
        this.deltaTime = (currentTime - this.lastUpdateTime) / 1000;
        // Prevent divide by zero error
        if (this.deltaTime == 0) { this.deltaTime = 0.01; }
        this.lastUpdateTime = currentTime;

        this.acceleration = (newProcessVariable - this.processVariable) / this.deltaTime;

        // Update stuff
        this.previousProcessVariable = this.processVariable;
        this.processVariable = newProcessVariable;

        this.previousError = this.currentError;
        this.currentError = this._setpoint - this.processVariable;
    }

    // Proportional error calculation
    calcProportionalError() {
        this.proportionalTerm = (this.currentError) * this.proportionalGain;
        console.log("Setpoint: " + this._setpoint + " | Process Variable: " + this.processVariable + " | Proportional Error: " + this.proportionalTerm);
    }
    // Integral error calculation
    calcIntegralError() {
        // Accumulate difference between current and target
        this.integralAccumulator += (this.currentError);

        // Reduce integrator (faster) if the error has changed sign
        let adjustmentFactor = 0.2;
        if ((this.processVariable >= this._setpoint && this.previousProcessVariable <= this._setpoint)) {
            console.log("Integral accumulator reduced");
            this.integralAccumulator = this.integralAccumulator * (1 - adjustmentFactor);
        } else if ((this.processVariable <= this._setpoint && this.previousProcessVariable >= this._setpoint)) {
            console.log("Integral accumulator increased");
            this.integralAccumulator = this.integralAccumulator * (1 + adjustmentFactor);
        }

        // Calculate integral error
        this.integralTerm = this.integralGain * this.integralAccumulator;
    }

    // Derivative error calculation
    calcDerivativeError() {
        // Calculate rate of change of error
        let derivative = - ((this.currentError - this.previousError) / this.deltaTime) * this.derivativeGain;

        /*************
         * LP Filter *
         * ***********/
        // Filter derivative term to reduce noise
        this.filteredDerivative += this.filterConstant * (derivative - this.filteredDerivative);
        // Set derivative term
        this.derivativeTerm = -this.filteredDerivative;
    }

    backCalculateIntegralError() {
        /************
         * Back-calculation of integral term *
         * **********/
        
        // Calculate the control signal without considering the integral part
        let uBackCalc = this.proportionalTerm + this.derivativeTerm;
        // Adjust the integral accumulator by the difference between the desired control signal and non-integral control signal, 
        //divided by the integral gain and multiplied by the time elapsed. This will prevent integral wind-up.
        this.integralAccumulator += - ((this.totalTerm - uBackCalc) / this.integralGain * this.deltaTime);



        // Debug code
        let x = (this.totalTerm - uBackCalc) / this.integralGain * this.deltaTime;
        console.log("Integral Accumulator: " + this.integralAccumulator + " | x: " + x)
        log(uBackCalc, " ", this.totalTerm, " ", this.integralGain, " ", this.deltaTime);
        // End of debug code
    }


    updateChartData() {
        this.proportionalErrorData.push(this.proportionalTerm);
        this.integralErrorData.push(this.integralTerm);
        this.derivativeErrorData.push(this.derivativeTerm);
        this.processVariableData.push(this.processVariable);
        this.totalTermData.push(this.totalTerm);
        this.accelerationData.push(this.acceleration);


        if (this.proportionalErrorData.length > 100) this.proportionalErrorData.shift();
        if (this.integralErrorData.length > 100) this.integralErrorData.shift();
        if (this.derivativeErrorData.length > 100) this.derivativeErrorData.shift();
        if (this.processVariableData.length > 100) this.processVariableData.shift();
        if (this.totalTermData.length > 100) this.totalTermData.shift();
        if (this.accelerationData.length > 100) this.accelerationData.shift();
    }
}

export default PID;