module.exports = function bodyValue(type, mass, terra) {
	if (type === 'unknown')
		return 0;
	let baseval = 0;
	let bonusval = 0;
	switch (type.toLowerCase()) {
		case 'metal-rich body':
			baseval = 52292;
		break;
		case 'high metal content body':
		case 'class ii gas giant':
			baseval = 23168;
			if (terra)
				bonusval = 241607;
		break;
		case 'earthlike body':
		case 'earth-like world':
			baseval = 155581;
			bonusval = 279088;
		break;
		case 'water world':
			baseval = 155581;
			if (terra)
				bonusval = 279088;
		break;
		case 'ammonia world':
			baseval = 232619;
		break;
		case 'class i gas giant':
			baseval = 3974;
		break;
		default:
			baseval = 720;
			if (terra)
				bonusval = 223971;
		break;
	}
	let value = baseval + (3 * baseval * Math.pow(mass, 0.199977) / 5.3);
	if (bonusval > 0)
		value += bonusval + (3 * bonusval * Math.pow(mass, 0.199977) / 5.3);
	return value;
};