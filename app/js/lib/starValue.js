module.exports = function starValue(type, mass) {
	let baseval = 0;
	if (type.indexOf('White Dwarf') === 0)
		baseval = 33737;
	else if (type === 'Black Hole' || type === 'Neutron Star' || type === 'H' || type === 'N') 
		baseval = 54309;
	else
		baseval = 2880;
	return baseval + (mass * baseval / 66.25);
};