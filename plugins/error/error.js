function function1() {
    function2();
}

function function2() {
    function3();
}

function function3() {
    throw new Error("Error on line 10");
}

function1();