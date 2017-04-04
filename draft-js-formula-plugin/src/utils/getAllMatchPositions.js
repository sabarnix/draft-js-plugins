const getAllMatchPositions = (string, regex) => {
    let match;
    const indexes= [];
    while (match = regex.exec(string)) {
        indexes.push([match.index, match.index+match[0].length]);
    }
    return indexes;    
}

export default getAllMatchPositions;