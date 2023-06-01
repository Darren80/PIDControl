class Car {
    constructor(mass = 1200, numPassengers = 5) {
        this.baseWeight = mass;  // Weight in kg when empty
        this.passengerWeight = 80;  // Average weight of a passenger in kg
        this.numPassengers = numPassengers; // Number of passengers in the car

        this.velocity = 0;  // Speed in mph
        this.topSpeed = 120;  // Maximum speed in mph for the base weight
        this.accelerationLimit = 10;  // Maximum acceleration in mph/s for the base weight

        this.previousTimestamp = Date.now();  // For deltaTime calculation

        this.sigmoidSteepness = 0.08;  // Steepness of the sigmoid function curve depends on topSpeed. The higher the topSpeed, the shallower the curve.
    }

    // Getter for current weight
    get totalWeight() {
        // Weight increases with each passenger
        return this.baseWeight + (this.numPassengers * this.passengerWeight);
    }

    scaleAcelerationBySpeed(aceleration) {
        let logisticFunction = () => {
            // Sigmoid function
            return (1 / (1 + Math.exp(-this.sigmoidSteepness * (this.velocity - this.topSpeed / 2 )))) ;
        }
        console.log(logisticFunction(aceleration), "<- logisticFunction(aceleration)")
        return aceleration * (1 - logisticFunction(aceleration));
    }

    scaleAccelerationByMass(acceleration) {
        // Get the force firstt
        let force = acceleration * this.baseWeight;
        // Calculate new acceleration
        return force / this.totalWeight;
    }

    // Update speed using PID controller output
    update(throttle) {
        // "throttle" is a value ranging from 0 to 100, to speed up the car

        // Calculate deltaTime since last update() call
        let currentTimestamp = Date.now();
        let deltaTime = (currentTimestamp - this.previousTimestamp) / 1000.0;  // Convert ms to s
        this.previousTimestamp = currentTimestamp;

        // Calculate acceleration by random constant. The random constant represents the calculated engine power (mass, force, power)
        let provisionalAcceleration = throttle * 0.5;
        console.log(provisionalAcceleration, "<- provisionalAcceleration")

        // The logistic function is used to simulate drag and make the reduction in acceleration more gradual
        provisionalAcceleration = this.scaleAcelerationBySpeed(provisionalAcceleration);
        console.log(provisionalAcceleration, "<- provisionalAcceleration")

        // Reduce acceleration by mass (i.e. the more mass, the less acceleration) (using number of passengers as a proxy for mass)
        provisionalAcceleration = this.scaleAccelerationByMass(provisionalAcceleration);
        console.log(provisionalAcceleration, "<- provisionalAcceleration")

        // Clamp acceleration if it exceeds the acceleration limit
        if (provisionalAcceleration > this.accelerationLimit) {
            provisionalAcceleration = this.accelerationLimit;
        } else if (provisionalAcceleration < -this.accelerationLimit) {
            provisionalAcceleration = -this.accelerationLimit;
        }

        // Clamp the velocity if it exceeds the top speed
        if (this.velocity > this.topSpeed) {
            this.velocity = this.topSpeed;
        } else {
            // Update speed using acceleration and deltaTime 
            this.velocity += (provisionalAcceleration) * deltaTime;
        }
    }
}

export default Car;
