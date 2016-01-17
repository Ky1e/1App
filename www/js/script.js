/**
 * Created by Kyle on 11/14/15.
 */
var money;
var earned;
var totalEarned;
var angels;
var angelRate;

var totalIncMultiplier;
var totalTimeMultiplier;
var minOwned;

var owned;
var incMultiplier;
var timeMultiplier;
var progress;

var upgradesOwned;
var managersOwned;

var before;
var speed;
var buyAmount;

var investments = [
    new Investment("PC Computers",4,1,1.07,1.5),
    new Investment("Windows 10",60,60,1.15,3),
    new Investment("Text Editor",720,540,1.14,6) ];

var upgrades = [
    new Upgrade("MacBook Pro","Profit x3",250000,"incMultiplier[0]","*3"),
    new Upgrade("OSX 10 El Capitan","Profit x3",500000,"incMultiplier[1]","*3"),
    new Upgrade("Software Update","Profit x3",1000000,"incMultiplier[2]","*3"),
    new Upgrade("Total Update","All profits x3",1000000000000,"totalIncMultiplier","*3") ];

var managers = [
    new Manager("Employee 1","Automatically runs the PC Computers",1000),
    new Manager("Employee 2","Automatically runs the updates for the operating systems",15000),
    new Manager("Employee 3","Automatically runs the code",100000) ];

var speeds = [1, 3, 10, 100, 1000];
var buyAmounts = [1, 10, 100, -1];

var fps = 60;
var interval = 1000/fps;
var save = 0;
var menuIndex = 0;

var init = false; // if initialization is complete
var allVars = ["money","earned","totalEarned","angels","angelRate","totalIncMultiplier","totalTimeMultiplier","minOwned","owned","incMultiplier","timeMultiplier","progress","upgradesOwned","managersOwned","before","speed","buyAmount"];
var salt = "CapKey";

// helper functions to store and load information
function getItem(key) {
    return JSON.parse(localStorage.getItem(key));
}

function setItem(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

// stolen from stackoverflow (http://stackoverflow.com/a/10899795)
function numberWithCommas(n) {
    var parts=n.toString().split(".");
    return parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",") + (parts[1] ? "." + parts[1] : "");
}

// make numbers look pretty
function fix(x, n) {
    if (x >= 1e9) {
        var z = Math.floor(logFloor(x)/3);
        var prefixes = ["Billion","Trillion","Quadrillion","Quintillion","Sextillion","Septillion","Octillion","Nonillion","Decillion","Undecillion","Duodecillion","Tredecillion"];
        var s = fix(x/Math.pow(10,3*z),n);
        return s+" "+prefixes[z-3];
    }
    return numberWithCommas(x.toFixed(n));
}

function logFloor(x) {
    var count = 0;
    while (x >= 10) {
        count++;
        x /= 10;
    }
    return count;
}

// returns random integer between 0 and n-1
function random(n) {
    return Math.floor(n*Math.random());
}

function initVariables() {
    money = 0;
    earned = 0;
    totalEarned = 0;
    angels = 0;
    angelRate = 2;

    totalIncMultiplier = 1;
    totalTimeMultiplier = 1;
    minOwned = 0;

    owned = [];
    for (var i = 0; i < investments.length; i++)
        owned.push(0);
    owned[0] = 1; // free investment to start with

    incMultiplier = [];
    for (var i = 0; i < investments.length; i++)
        incMultiplier.push(1);

    timeMultiplier = [];
    for (var i = 0; i < investments.length; i++)
        timeMultiplier.push(1);

    progress = [];
    for (var i = 0; i < investments.length; i++)
        progress.push(0);

    upgradesOwned = [];
    for (var i = 0; i < upgrades.length; i++)
        upgradesOwned.push(false);

    managersOwned = [];
    for (var i = 0; i < managers.length; i++)
        managersOwned.push(false);

    before = new Date().getTime();
    speed = 0;
    buyAmount = 0;
}


window.onload = function() {
    // initialize variables for new game
    initVariables();

    // retrieve all the saved info if there is a savefile
    for (var i = 0; i < allVars.length; i++)
        if (getItem(allVars[i]+salt) != null && getItem(allVars[i]+salt) != undefined)
            window[allVars[i]] = getItem(allVars[i]+salt);

    // initialize upgrades
    for (var i = 0; i < upgrades.length; i++) {
        var u = upgrades[i];
        $("#upgradeName"+(i+1)).html(u.name);
        $("#upgradeText"+(i+1)).html(u.text);
        $("#upgradePrice"+(i+1)).html("$"+fix(u.price,0));
    }

    for (var i = 0; i < upgrades.length; i++)
        if (upgradesOwned[i])
            $("#upgradeBought"+(i+1)).css("display","initial");
        else
            $("#upgradeBought"+(i+1)).css("display","none");


    // initialize managers
    for (var i = 0; i < managers.length; i++) {
        var m = managers[i];
        $("#managerName"+(i+1)).html(m.name);
        $("#managerText"+(i+1)).html(m.text);
        $("#managerPrice"+(i+1)).html("$"+fix(m.price,0));
    }

    for (var i = 0; i < managers.length; i++)
        if (managersOwned[i])
            $("#managerBought"+(i+1)).css("display","initial");
        else
            $("#managerBought"+(i+1)).css("display","none");

    // initialize speeds
    for (var i = 0; i < speeds.length; i++)
        $("#speedText"+(i+1)).html("x"+speeds[i]);
    changeSpeed(speed+1);

    // initialize buy amounts
    for (var i = 0; i < buyAmounts.length; i++)
        $("#buyText"+(i+1)).html(buyAmounts[i]>0?("x"+buyAmounts[i]):"MAX");
    changeBuy(buyAmount+1);

    updateInvestments();

    // initialization complete
    init = true;
}

// get cost of investment, 0-indexed
function getPrice(index) {
    var b = investments[index];
    var mul = Math.pow(b.inflation,owned[index]-(index==0?1:0));
    return b.price*mul;
}

// get inc of investment, 0-indexed
function getInc(index) {
    return investments[index].inc * incMultiplier[index] * totalIncMultiplier * (1+angels*angelRate/100);
}

// get time of investment, 0-indexed
function getTime(index) {
    return investments[index].time * timeMultiplier[index] * totalTimeMultiplier;
}

// set name, owned, price, and inc of investments; allow investments to be used
function updateInvestments() {
    for (var i = 1; i <= investments.length; i++) {
        $(".name"+i).html(investments[i-1].name);
        $("#owned"+i).html(owned[i-1]);
        $("#cost"+i).html("$"+fix(getPrice(i-1),2));
        $(".inc"+i).html("$"+fix(owned[i-1]*getInc(i-1),2));
        if (owned[i-1] == 0)
            $("#block"+i).css("display","initial"); // can't click if no investments owned
        else
            $("#block"+i).css("display","none");

        if (progress[i-1] == 0 && !managersOwned[i-1])
            $("#clickme"+i).css("display","initial"); // no more need for manual clicking
        else
            $("#clickme"+i).css("display","none"); // no more need for manual clicking

    }

    minOwned = owned[0];
    for (var i = 1; i < owned.length; i++)
        minOwned = Math.min(minOwned, owned[i]);
}

// begin the progress bar, 1-indexed
function clickme(index) {
    $("#clickme"+index).css("display","none");
    progress[index-1] = 0.01;
}

// buy the investment, 1-indexed
function buyInvestment(index) {
    var amount = buyAmounts[buyAmount] // how many to buy, -1 for max
    if (amount > 0)
        for (var i = 0; i < amount; i++)
            buyInvestmentOnce(index);
    else
        while (money >= getPrice(index-1))
            buyInvestmentOnce(index);
    updateInvestments();
}

function buyInvestmentOnce(index) {
    if (money < getPrice(index-1)) // cannot afford
        return;
    money -= getPrice(index-1)
    owned[index-1]++;
}

// buy the upgrade, 1-indexed
function buyUpgrade(index) {
    if (money < upgrades[index-1].price || upgradesOwned[index-1]) // cannot afford or owned
        return;
    money -= upgrades[index-1].price;
    upgradesOwned[index-1] = true;
    upgrades[index-1].upgrade();
    $("#upgradeBought"+index).css("display","initial");
    updateInvestments();
}

// buy the manager, 1-indexed
function buyManager(index) {
    if (money < managers[index-1].price || managersOwned[index-1]) // cannot afford or owned
        return;
    money -= managers[index-1].price;
    managersOwned[index-1] = true;
    $("#clickme"+index).css("display","none"); // no more need for manual clicking
    $("#managerBought"+index).css("display","initial");
}

function buyAllUpgrades() {
    for (var i = 1; i <= upgrades.length; i++)
        buyUpgrade(i);
}

function buyAllManagers() {
    for (var i = 1; i <= managers.length; i++)
        buyManager(i);
}

// gain amount of money, change earned as well
function gainMoney(amount) {
    money += amount;
    earned += amount;
    totalEarned += amount;
}

// number of angels based on all time total
function numAngels(amount) {
    return Math.floor(150*Math.sqrt(amount/1e15));
}

function update(times) {
    // if initialization is not complete
    if (!init)
        return;

    times *= speeds[speed];

    // update investments
    for (var i = 0; i < investments.length; i++)
        if (owned[i] > 0 && (progress[i] > 0 || managersOwned[i])) {
            var b = investments[i];
            var t = getTime(i);
            progress[i] += times/fps;
            if (managersOwned[i]) {
                gainMoney(Math.floor(progress[i]/t)*getInc(i)*owned[i]);
                progress[i] %= t;
                var width = progress[i]/t*100;
                if (t < 0.05*speeds[speed])
                    width = 100; // always green at a certain point
                width = Math.max(width,1);
                $("#bar"+(i+1)).css("width",width+"%");
            }
            else
            if (progress[i] >= t) {
                gainMoney(getInc(i)*owned[i]);
                progress[i] = 0;
                $("#clickme"+(i+1)).css("display","initial");
            }
            else {
                var width = progress[i]/t*100;
                width = Math.max(width,1);
                $("#bar"+(i+1)).css("width",width+"%");
            }
        }

    // check if investments are buyable
    for (var i = 0; i < investments.length; i++)
        if (money >= getPrice(i))
            $("#button"+(i+1)).css("display","initial");
        else
            $("#button"+(i+1)).css("display","none");

    // check if upgrades are buyable
    for (var i = 0; i < upgrades.length; i++)
        if (!upgradesOwned[i] && money >= upgrades[i].price)
            $("#upgradeButton"+(i+1)).css("display","initial");
        else
            $("#upgradeButton"+(i+1)).css("display","none");


    // check if managers are buyable
    for (var i = 0; i < managers.length; i++)
        if (!managersOwned[i] && money >= managers[i].price)
            $("#managerButton"+(i+1)).css("display","initial");
        else
            $("#managerButton"+(i+1)).css("display","none");

    // display money and stuff
    $("#money").html("$"+fix(money,2));
    $("#earned").html("$" + fix(earned,2));
    $("#allTimeEarned").html("$" + fix(totalEarned,2));
    $("#angels").html(fix(angels,0));
    $("#angelsGain").html(fix(numAngels(totalEarned)-angels,0));

    // saving all your data like I'm the NSA
    save += times/fps;
    if (save > 1) { // every 1 second
        saveData();
        save = 0;
    }
}

// select an item from the menu
function menu(index) {
    if (index == menuIndex)
        index = 0;
    for (var i = 0; i <= 4; i++)
        $("#display"+i).css("display","none");
    $("#display"+index).css("display","initial");
    menuIndex = index;
}

function softReset() {
    var conf = confirm("Are you sure you want to reset?\nYou will gain "+fix(numAngels(totalEarned)-angels,0)+" angel investors.");
    if (conf) {
        var temp1 = speed;
        var temp2 = buyAmount;
        var temp3 = totalEarned;
        var temp4 = numAngels(totalEarned);
        initVariables();
        speed = temp1;
        buyAmount = temp2;
        totalEarned = temp3;
        angels = temp4;
        // correctly display bars
        for (var i = 1; i <= investments.length; i++) {
            $("#clickme"+i).css("display","initial");
            $("#bar"+i).css("width","0%");
        }
        // correctly display upgrades and managers
        for (var i = 1; i <= upgrades.length; i++)
            $("#upgradeBought"+i).css("display","none");
        for (var i = 1; i <= managers.length; i++)
            $("#managerBought"+i).css("display","none");

        changeSpeed(speed+1);
        changeBuy(buyAmount+1);
        updateInvestments();
        saveData();
    }
}

function hardReset() {
    var conf = confirm("Destroy all progress and start from scratch?\nAll money and angel investors will be lost!");
    if (conf) {
        var temp1 = speed;
        var temp2 = buyAmount;
        initVariables();
        speed = temp1;
        buyAmount = temp2;
        for (var i = 1; i <= investments.length; i++) {
            $("#clickme"+i).css("display","initial");
            $("#bar"+i).css("width","0%");
        }
        // correctly display bars
        for (var i = 1; i <= investments.length; i++) {
            $("#clickme"+i).css("display","initial");
            $("#bar"+i).css("width","0%");
        }
        // correctly display upgrades and managers
        for (var i = 1; i <= upgrades.length; i++)
            $("#upgradeBought"+i).css("display","none");
        for (var i = 1; i <= managers.length; i++)
            $("#managerBought"+i).css("display","none");

        changeSpeed(speed+1);
        changeBuy(buyAmount+1);
        updateInvestments();
        saveData();
    }
}

function saveData() {
    for (var i = 0; i < allVars.length; i++)
        setItem(allVars[i]+salt,window[allVars[i]]);
}

function changeSpeed(index) {
    for (var i = 1; i <= 5; i++)
        $("#speed"+i).css("background-color","#CCCCCC");
    $("#speed"+index).css("background-color","#777777");
    speed = index-1;
}

function changeBuy(index) {
    for (var i = 1; i <= 4; i++)
        $("#buy"+i).css("background-color","#CCCCCC");
    $("#buy"+index).css("background-color","#777777");
    buyAmount = index-1;
}

// game loop
setInterval(function() {
    now = new Date().getTime();
    var elapsedTime = now - before;
    if(elapsedTime > interval)
        update(Math.floor(elapsedTime/interval)); // recover the motion lost while inactive
    else
        update(1);
    before = new Date().getTime();
}, interval);

// classes and methods down here

// investments/investments
function Investment(name, price, inc, inflation, time) {
    this.name = name;			// name of investment
    this.price = price;			// initial price of investment
    this.inc = inc;				// investment production rate
    this.inflation = inflation;	// price increase rate
    this.time = time;			// time needed for investment
}

// upgrades for increasing profit
function Upgrade(name, text, price, changeName, changeString) {
    this.name = name;					// name of upgrade
    this.text = text;					// display text
    this.price = price;					// price of upgrade
    this.changeName = changeName;		// name of changed variable
    this.changeString = changeString;	// how to change the variable
}

Upgrade.prototype.upgrade = function() {
    var index = this.changeName.indexOf("[");
    if (index < 0) {
        var value = window[this.changeName];
        window[this.changeName] = eval(value + this.changeString);
    }
    else {
        var str = this.changeName.substring(0,index);
        var i = parseInt(this.changeName.substring(index+1,this.changeName.length-1));
        var value = window[str][i];
        window[str][i] = eval(value + this.changeString);
    }
}

// managers for automating investments
function Manager(name, text, price) {
    this.name = name;		// name of manager
    this.text = text;		// display text
    this.price = price;		// price of manager
}