/************************************************************************************************
 * Jaune JS implementation for the Rhino JavaScript engine.                                     *
 * This interpreter is still on experimental stage, but will eventually work for most programs. *
 * To use in a browser or another engine, replace with the respective input/output functions.   *
 * Uses an old dialect of ECMAScript in order to be backwards compatible with older platforms.  *
 * Author: CoffeeHax17                                                                          *
 * Date: 26-11-2021                                                                             *
 ************************************************************************************************/

var readCode, runCom, obj = {tape: [0], index: 0, hold: 0}, src = readFile("/path/to/source.jn"), compiled; // Replace readFile for use on other engines
readCode = function readCode(code) {
	var s, tk, i = -1, c, comnum = 0, commands = [], labels = {}, subs = {}, subcom = [], subname, subcomnum = 0, detcom, isNum;
	detcom = function detcom(tk, n, lb) {
		// The ser property is the command position, used only for debug purposes.
		if (tk == '>')      return {ser:n, com:"NEXT_CELL"};
		else if (tk == '<') return {ser:n, com:"PREV_CELL"};
		else if (tk == '?') return {ser:n, com:"GOTO_NZ", lbl:lb};
		else if (tk == '!') return {ser:n, com:"GOTO_Z", lbl:lb};
		else if (tk == '+') return {ser:n, com:"ADD", lbl:lb};
		else if (tk == '-') return {ser:n, com:"SUB", lbl:lb};
		else if (tk == '#') return {ser:n, com:"HOLD_I"};
		else if (tk == '&') return {ser:n, com:"HOLD_O"};
		else if (tk == '.') return {ser:n, com:"END"};
		else if (tk == '^') return {ser:n, com:"OUT"};
		else if (tk == '@') return {ser:n, com:"CALL", lbl:lb};
		else return new Error();
	};
	isNum = function isNum(c) {return c >= '0' && c <= '9' || c == 'v';};
	while ((c = code.charAt(i++)) != '.') {
		s = '';
		while (isNum((c = code.charAt(i)))) {
			s += c;
			i++;
		}
		if (c == ':') labels[s] = comnum;
		else commands.push(detcom(c, comnum++, s));
	}
	// Read subroutines
	i--;
	while ((c = code.charAt(i++))) {
		s = '';
		while (isNum((c = code.charAt(i)))) {
			s += c;
			i++;
		}
		if (c == '$') subname = s;
		else if (c == ';') {
			subcom.push(detcom('.', subcomnum));
			subs[subname] = subcom;
			subname = '';
			subcom = [];
			subcomnum = 0;
		}
		else subcom.push(detcom(c, subcomnum++, s));
	}
	return [commands, labels, subs];
};

runCom = function runCom(compiled, obj) {
	var commands = compiled[0], labels = compiled[1], subs = compiled[2], cur = 0, com;
	while ((com = commands[cur])) {
		switch (com.com) {
			case "NEXT_CELL" : obj.index++; if (!obj.tape[obj.index]) obj.tape[obj.index] = 0; break;
			case "PREV_CELL" : obj.index--; if (!obj.tape[obj.index]) obj.tape[obj.index] = 0; break;
			case "ADD"       : obj.tape[obj.index] += (com.lbl == 'v' ? new java.util.Scanner(java.lang.System.in).nextInt() : parseInt(com.lbl)); break;
			case "SUB"       : obj.tape[obj.index] -= (com.lbl == 'v' ? new java.util.Scanner(java.lang.System.in).nextInt() : parseInt(com.lbl)); break;
			case "HOLD_I"    : obj.hold = obj.tape[obj.index]; break;
			case "HOLD_O"    : obj.tape[obj.index] += obj.hold; break;
			case "GOTO_NZ"   : if (obj.tape[obj.index] != 0) cur = labels[com.lbl] - 1; break;
			case "GOTO_Z"    : if (obj.tape[obj.index] == 0) cur = labels[com.lbl] - 1; break;
			case "CALL"      : runCom([subs[com.lbl], labels, subs], obj); break;
			case "OUT"       : print(obj.tape[obj.index]); break;
			case "END"       : return;
			default          : print("Syntax error"); return;
		}
		cur++;
	}
};

compiled = readCode(src);
runCom(compiled, obj);
