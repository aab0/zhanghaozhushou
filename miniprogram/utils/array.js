export const group = (list, count = 3) => {
  const res = []
  for(let i = 0; i < list.length; i += count) {
    res.push(list.slice(i, i +count))
  }
  return res
}

export const groupBy = (objectArray, property) => {
  return objectArray.reduce(function (acc, obj) {
    var key = obj[property];
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(obj);
    return acc;
  }, {});
}