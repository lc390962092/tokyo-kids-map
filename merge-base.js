const fs = require('fs');
const existing = require('./src/data/seed.json');

const base30 = [
  { id:'10000000-0000-4000-8000-000000000001', slug:'arakawa-nature-park', name_zh:'荒川自然公园', name_ja:'荒川自然公園', category:'park', ward:'荒川区', lat:35.7407, lng:139.7826, address:'東京都荒川区荒川8丁目25-3', station:'荒川二丁目站', age_min:1, age_max:10, indoor:false, rainy:false, free:true, stroller:4, diaper:3, parking:2, play:5, desc:'有大片绿地、交通园和水边步道，是荒川区经典放电点，适合半天慢慢玩。', tips:'交通园很受欢迎，周末上午更从容；夏天记得带驱蚊和换洗衣物。', image:'photo-1519331379826-f10be5486c6f' },
  { id:'10000000-0000-4000-8000-000000000002', slug:'shioiri-park', name_zh:'汐入公园', name_ja:'汐入公園', category:'park', ward:'荒川区', lat:35.7353, lng:139.8112, address:'東京都荒川区南千住8丁目13-1', station:'南千住站', age_min:0, age_max:10, indoor:false, rainy:false, free:true, stroller:5, diaper:3, parking:3, play:5, desc:'隅田川边的大型公园，视野开阔，草地、 playground 和散步路线都很适合亲子。', tips:'婴儿车推行舒服，傍晚风景好；风大的日子注意保暖。', image:'photo-1500530855697-b586d89ba3ee' },
  { id:'10000000-0000-4000-8000-000000000003', slug:'nippori-minami-park', name_zh:'日暮里南公园', name_ja:'日暮里南公園', category:'park', ward:'荒川区', lat:35.7257, lng:139.7752, address:'東京都荒川区東日暮里5丁目19', station:'日暮里站', age_min:1, age_max:8, indoor:false, rainy:false, free:true, stroller:4, diaper:2, parking:1, play:3, desc:'车站附近的小型公园，适合顺路短暂停留，给孩子跑一跑、滑一滑。', tips:'空间不算大，更适合饭前饭后的短时间放电。', image:'photo-1521791136064-7986c2920216' },
  { id:'10000000-0000-4000-8000-000000000004', slug:'tenno-park', name_zh:'天王公园', name_ja:'天王公園', category:'park', ward:'荒川区', lat:35.7339, lng:139.7908, address:'東京都荒川区南千住6丁目67', station:'南千住站', age_min:1, age_max:9, indoor:false, rainy:false, free:true, stroller:4, diaper:2, parking:2, play:4, desc:'社区型公园，游具和开放空间平衡，适合附近家庭日常遛娃。', tips:'下午人会多，低龄宝宝建议避开大孩子集中的时段。', image:'photo-1518156677180-95a2893f3499' },
  { id:'10000000-0000-4000-8000-000000000005', slug:'ogunohara-park', name_zh:'尾久之原公园', name_ja:'尾久の原公園', category:'park', ward:'荒川区', lat:35.7515, lng:139.7747, address:'東京都荒川区東尾久7丁目1', station:'熊野前站', age_min:0, age_max:10, indoor:false, rainy:false, free:true, stroller:5, diaper:3, parking:2, play:4, desc:'以广阔草地和蜻蜓池闻名，节奏舒缓，很适合野餐和自然观察。', tips:'草地面积大，带野餐垫体验更好；雨后部分区域会泥泞。', image:'photo-1441974231531-c6227db76b6e' },
  { id:'10000000-0000-4000-8000-000000000006', slug:'yuinomori-arakawa', name_zh:'ゆいの森荒川', name_ja:'ゆいの森あらかわ', category:'library', ward:'荒川区', lat:35.7364, lng:139.7819, address:'東京都荒川区荒川2丁目50-1', station:'荒川二丁目站', age_min:0, age_max:10, indoor:true, rainy:true, free:true, stroller:5, diaper:5, parking:2, play:3, desc:'图书馆、儿童空间和学习设施结合的亲子友好室内去处，雨天非常实用。', tips:'低龄区安静舒适，适合雨天续航；注意馆内饮食规则。', image:'photo-1521587760476-6c12a4b040da' },
  { id:'10000000-0000-4000-8000-000000000007', slug:'arakawa-yuen', name_zh:'荒川游园', name_ja:'あらかわ遊園', category:'indoor_play', ward:'荒川区', lat:35.7513, lng:139.7588, address:'東京都荒川区西尾久6丁目35-11', station:'荒川游园地前站', age_min:1, age_max:8, indoor:false, rainy:false, free:false, stroller:4, diaper:4, parking:3, play:5, desc:'复古亲子游乐园，设施温和，对幼儿和小学低年级很友好。', tips:'热门项目可能排队，建议提前确认营业日和门票规则。', image:'photo-1502136969935-8d8eef54d77b' },
  { id:'10000000-0000-4000-8000-000000000008', slug:'asukayama-park', name_zh:'飞鸟山公园', name_ja:'飛鳥山公園', category:'park', ward:'北区', lat:35.7509, lng:139.7382, address:'東京都北区王子1丁目1-3', station:'王子站', age_min:0, age_max:10, indoor:false, rainy:false, free:true, stroller:4, diaper:3, parking:2, play:5, desc:'有大型游具、火车展示和季节花景，是北区代表性的亲子公园。', tips:'小山坡较多，婴儿车建议走缓坡路线；樱花季人流很大。', image:'photo-1522383225653-ed111181a951' },
  { id:'10000000-0000-4000-8000-000000000009', slug:'ueno-zoo', name_zh:'上野动物园', name_ja:'上野動物園', category:'zoo', ward:'台东区', lat:35.7167, lng:139.7714, address:'東京都台東区上野公園9-83', station:'上野站', age_min:1, age_max:10, indoor:false, rainy:false, free:false, stroller:4, diaper:4, parking:2, play:5, desc:'东京经典动物园，动物种类丰富，适合安排半天到一天。', tips:'园区大，提前定好重点路线；午后低龄孩子容易累。', image:'photo-1546182990-dffeafbe841d' },
  { id:'10000000-0000-4000-8000-000000000010', slug:'ueno-park', name_zh:'上野恩赐公园', name_ja:'上野恩賜公園', category:'park', ward:'台东区', lat:35.7148, lng:139.7735, address:'東京都台東区上野公園', station:'上野站', age_min:0, age_max:10, indoor:false, rainy:false, free:true, stroller:4, diaper:3, parking:2, play:4, desc:'公园、美术馆、动物园和池塘集中，适合按天气灵活组合行程。', tips:'周末人多，带娃建议早到；可和动物园或博物馆搭配。', image:'photo-1557409518-691ebcd96038' },
  { id:'10000000-0000-4000-8000-000000000011', slug:'national-museum-nature-science', name_zh:'国立科学博物馆', name_ja:'国立科学博物館', category:'science_museum', ward:'台东区', lat:35.7163, lng:139.7765, address:'東京都台東区上野公園7-20', station:'上野站', age_min:3, age_max:10, indoor:true, rainy:true, free:false, stroller:4, diaper:4, parking:2, play:4, desc:'恐龙、自然科学和互动展示丰富，是雨天或酷暑天的高质量室内选择。', tips:'展馆信息量大，3-6 岁建议只选几个重点区域，不要贪多。', image:'photo-1566127444979-b3d2b654e3d7' },
  { id:'10000000-0000-4000-8000-000000000012', slug:'tokyo-national-museum', name_zh:'东京国立博物馆', name_ja:'東京国立博物館', category:'museum', ward:'台东区', lat:35.7188, lng:139.7765, address:'東京都台東区上野公園13-9', station:'上野站', age_min:5, age_max:10, indoor:true, rainy:true, free:false, stroller:4, diaper:3, parking:2, play:2, desc:'适合对历史、器物和建筑感兴趣的大孩子，空间安静，节奏偏文化体验。', tips:'不建议安排太久，和上野公园散步搭配会更轻松。', image:'photo-1565060169194-19fabf63012d' },
  { id:'10000000-0000-4000-8000-000000000013', slug:'sumida-aquarium', name_zh:'墨田水族馆', name_ja:'すみだ水族館', category:'aquarium', ward:'墨田区', lat:35.7101, lng:139.8107, address:'東京都墨田区押上1丁目1-2', station:'押上站', age_min:0, age_max:10, indoor:true, rainy:true, free:false, stroller:4, diaper:4, parking:4, play:3, desc:'晴空塔内的城市水族馆，动线紧凑，低龄宝宝也容易看完。', tips:'雨天和假日人流明显，建议避开午后高峰。', image:'photo-1544551763-46a013bb70d5' },
  { id:'10000000-0000-4000-8000-000000000014', slug:'tokyo-skytree', name_zh:'东京晴空塔', name_ja:'東京スカイツリー', category:'landmark', ward:'墨田区', lat:35.7101, lng:139.8107, address:'東京都墨田区押上1丁目1-2', station:'押上站', age_min:0, age_max:10, indoor:true, rainy:true, free:false, stroller:5, diaper:5, parking:4, play:3, desc:'商场、水族馆、观景台和餐饮集中，天气不好时也能安排完整亲子半日。', tips:'商场设施完善，但人多；婴儿车家庭建议预留电梯等待时间。', image:'photo-1536098561742-ca998e48cbcc' },
  { id:'10000000-0000-4000-8000-000000000015', slug:'sumida-park', name_zh:'隅田公园', name_ja:'隅田公園', category:'park', ward:'墨田区', lat:35.7127, lng:139.8036, address:'東京都墨田区向島1丁目', station:'浅草站', age_min:0, age_max:10, indoor:false, rainy:false, free:true, stroller:4, diaper:2, parking:2, play:3, desc:'沿隅田川展开的散步型公园，可以看到晴空塔，适合轻松走走。', tips:'更适合散步拍照，不是强游具型；春季赏樱人很多。', image:'photo-1505069446780-4ef442b5207f' },
  { id:'10000000-0000-4000-8000-000000000016', slug:'higashi-shirahige-park', name_zh:'东白鬚公园', name_ja:'東白鬚公園', category:'park', ward:'墨田区', lat:35.7311, lng:139.8157, address:'東京都墨田区堤通2丁目2', station:'钟淵站', age_min:1, age_max:10, indoor:false, rainy:false, free:true, stroller:4, diaper:3, parking:3, play:4, desc:'沿河大型公园，跑跳空间充足，适合自行车、散步和季节性活动。', tips:'园区较长，先确认入口和目的区域，避免孩子走太累。', image:'photo-1473773508845-188df298d2d1' },
  { id:'10000000-0000-4000-8000-000000000017', slug:'adachi-park-of-living-things', name_zh:'足立区生物园', name_ja:'足立区生物園', category:'zoo', ward:'足立区', lat:35.7844, lng:139.8003, address:'東京都足立区保木間2丁目17-1', station:'竹之塚站', age_min:1, age_max:10, indoor:true, rainy:true, free:false, stroller:4, diaper:4, parking:3, play:4, desc:'规模不大但内容密度高，可以近距离观察昆虫、小动物和水生生物。', tips:'很适合幼儿第一次动物观察，和附近公园搭配更充实。', image:'photo-1551189014-fe516aed0e9e' },
  { id:'10000000-0000-4000-8000-000000000018', slug:'toneri-park', name_zh:'舍人公园', name_ja:'舎人公園', category:'park', ward:'足立区', lat:35.7967, lng:139.7707, address:'東京都足立区舎人公園1-1', station:'舎人公园站', age_min:0, age_max:10, indoor:false, rainy:false, free:true, stroller:5, diaper:3, parking:5, play:5, desc:'足立区大型都立公园，草地、水边、游具和烧烤区丰富，适合一整天。', tips:'面积很大，建议定一个集合点；开车家庭相对友好。', image:'photo-1506744038136-46273834b3fb' },
  { id:'10000000-0000-4000-8000-000000000019', slug:'adachi-urban-agricultural-park', name_zh:'都市农园足立', name_ja:'足立区都市農業公園', category:'park', ward:'足立区', lat:35.7852, lng:139.7398, address:'東京都足立区鹿浜2丁目44-1', station:'西新井大师西站', age_min:1, age_max:10, indoor:false, rainy:false, free:true, stroller:4, diaper:3, parking:4, play:4, desc:'能接触农作物、花田和自然景观，适合想让孩子体验季节感的家庭。', tips:'活动和花期会变化，出发前查一下官方日程更稳。', image:'photo-1500382017468-9049fed747ef' },
  { id:'10000000-0000-4000-8000-000000000020', slug:'kita-central-park', name_zh:'北区中央公园', name_ja:'北区中央公園', category:'park', ward:'北区', lat:35.7589, lng:139.7229, address:'東京都北区十条台1丁目2-1', station:'十条站', age_min:0, age_max:10, indoor:false, rainy:false, free:true, stroller:4, diaper:3, parking:3, play:4, desc:'绿地宽敞，氛围安静，适合散步、野餐和日常消耗体力。', tips:'树荫不错，夏天也相对舒服；游具区和草地区可分开安排。', image:'photo-1464822759023-fed622ff2c3b' },
  { id:'10000000-0000-4000-8000-000000000021', slug:'otonashi-shinsui-park', name_zh:'音无亲水公园', name_ja:'音無親水公園', category:'river', ward:'北区', lat:35.7547, lng:139.7385, address:'東京都北区王子本町1丁目', station:'王子站', age_min:2, age_max:10, indoor:false, rainy:false, free:true, stroller:3, diaper:2, parking:1, play:3, desc:'小而有特色的亲水空间，适合夏季短时间玩水和散步。', tips:'石阶和水边较多，低龄孩子需要牵好；带毛巾和备用鞋。', image:'photo-1437482078695-73f5ca6c96e2' },
  { id:'10000000-0000-4000-8000-000000000022', slug:'oji-children-center', name_zh:'王子儿童馆', name_ja:'王子児童館', category:'children_center', ward:'北区', lat:35.7558, lng:139.7367, address:'東京都北区王子2丁目7', station:'王子站', age_min:0, age_max:6, indoor:true, rainy:true, free:true, stroller:4, diaper:4, parking:1, play:3, desc:'适合低龄孩子的室内公共空间，雨天、酷暑或寒冷天气可作为稳定备选。', tips:'初次去建议带在留相关证件，确认开放时间和适用年龄。', image:'photo-1503454537195-1dcabb73ffb9' },
  { id:'10000000-0000-4000-8000-000000000023', slug:'arakawa-children-family-center', name_zh:'荒川儿童家庭中心', name_ja:'荒川子ども家庭総合センター', category:'children_center', ward:'荒川区', lat:35.736, lng:139.7832, address:'東京都荒川区荒川1丁目50', station:'荒川区役所前站', age_min:0, age_max:6, indoor:true, rainy:true, free:true, stroller:4, diaper:4, parking:1, play:3, desc:'面向亲子和育儿家庭的公共设施，适合低龄宝宝活动和家长获取育儿信息。', tips:'具体活动多按日期变化，去之前看一下区官网通知。', image:'photo-1564429097439-e400382dc893' },
  { id:'10000000-0000-4000-8000-000000000024', slug:'minamisenju-children-center', name_zh:'南千住儿童馆', name_ja:'南千住児童館', category:'children_center', ward:'荒川区', lat:35.7338, lng:139.7997, address:'東京都荒川区南千住', station:'南千住站', age_min:0, age_max:8, indoor:true, rainy:true, free:true, stroller:4, diaper:4, parking:1, play:3, desc:'社区型儿童馆，适合雨天补位和低龄孩子短时间室内活动。', tips:'公共设施规则会因年龄段不同，初次使用先问工作人员最省心。', image:'photo-1542810634-71277d95dcbb' },
  { id:'10000000-0000-4000-8000-000000000025', slug:'machiya-library', name_zh:'町屋图书馆', name_ja:'町屋図書館', category:'library', ward:'荒川区', lat:35.7429, lng:139.7813, address:'東京都荒川区町屋5丁目11', station:'町屋站', age_min:0, age_max:10, indoor:true, rainy:true, free:true, stroller:4, diaper:3, parking:1, play:2, desc:'安静的社区图书馆，适合亲子阅读、借绘本和雨天短暂停留。', tips:'更偏阅读不偏放电，适合和附近公园组合。', image:'photo-1507842217343-583bb7270b66' },
  { id:'10000000-0000-4000-8000-000000000026', slug:'arakawa-riverside', name_zh:'荒川河川敷', name_ja:'荒川河川敷', category:'river', ward:'足立区', lat:35.7667, lng:139.7902, address:'東京都足立区千住周辺', station:'北千住站', age_min:2, age_max:10, indoor:false, rainy:false, free:true, stroller:4, diaper:1, parking:3, play:4, desc:'开阔河川地，适合骑车、跑步、放风筝和大孩子释放体力。', tips:'遮阴和厕所位置要提前确认；风大时体感温度会低。', image:'photo-1470770841072-f978cf4d019e' },
  { id:'10000000-0000-4000-8000-000000000027', slug:'shioiri-waterfront', name_zh:'汐入亲水空间', name_ja:'汐入親水広場', category:'river', ward:'荒川区', lat:35.7361, lng:139.8092, address:'東京都荒川区南千住8丁目', station:'南千住站', age_min:1, age_max:10, indoor:false, rainy:false, free:true, stroller:4, diaper:2, parking:2, play:3, desc:'靠近汐入公园的水边散步空间，适合推车散步和看船。', tips:'可和汐入公园合并成一条轻松路线，低龄孩子注意水边安全。', image:'photo-1507525428034-b723cf961d3e' },
  { id:'10000000-0000-4000-8000-000000000028', slug:'taito-children-center', name_zh:'台东儿童馆', name_ja:'台東児童館', category:'children_center', ward:'台东区', lat:35.712, lng:139.7839, address:'東京都台東区台東', station:'新御徒町站', age_min:0, age_max:8, indoor:true, rainy:true, free:true, stroller:4, diaper:4, parking:1, play:3, desc:'台东区内适合亲子使用的室内儿童空间，适合作为雨天附近备选。', tips:'公共儿童馆常有使用登记和时间段规则，初访前建议确认。', image:'photo-1503454537195-1dcabb73ffb9' },
  { id:'10000000-0000-4000-8000-000000000029', slug:'sumida-children-center', name_zh:'墨田儿童馆', name_ja:'すみだ児童館', category:'children_center', ward:'墨田区', lat:35.7108, lng:139.8015, address:'東京都墨田区', station:'本所吾妻桥站', age_min:0, age_max:8, indoor:true, rainy:true, free:true, stroller:4, diaper:4, parking:1, play:3, desc:'社区亲子活动空间，适合小朋友室内活动和家长临时避雨休整。', tips:'适合安排在晴空塔、隅田公园周边行程的补充点。', image:'photo-1516627145497-ae6968895b74' },
  { id:'10000000-0000-4000-8000-000000000030', slug:'kita-children-center', name_zh:'北区儿童馆', name_ja:'北区児童館', category:'children_center', ward:'北区', lat:35.7581, lng:139.735, address:'東京都北区', station:'王子站', age_min:0, age_max:8, indoor:true, rainy:true, free:true, stroller:4, diaper:4, parking:1, play:3, desc:'北区家庭常用的室内儿童活动备选，适合天气不稳定时安排。', tips:'和飞鸟山、王子周边路线组合，能让一天更有弹性。', image:'photo-1516627145497-ae6968895b74' }
];

const baseRecords = base30.map(b => ({
  id: b.id, slug: b.slug, name_zh: b.name_zh, name_ja: b.name_ja,
  category: b.category, ward: b.ward, latitude: b.lat, longitude: b.lng,
  address: b.address, nearest_station: b.station,
  age_min: b.age_min, age_max: b.age_max,
  indoor: b.indoor, rainy_day: b.rainy, free_entry: b.free,
  stroller_score: b.stroller, diaper_score: b.diaper,
  parking_score: b.parking, play_score: b.play,
  description: b.desc, tips: b.tips,
  image_url: 'https://images.unsplash.com/' + b.image + '?auto=format&fit=crop&w=1200&q=80'
}));

const baseIds = new Set(base30.map(b => b.id));
const baseNames = new Set(base30.map(b => b.name_zh));

const keep = [];
const seenNames = new Set(baseNames);

baseRecords.forEach(r => keep.push(r));

existing.forEach(e => {
  if (baseIds.has(e.id)) return;
  if (seenNames.has(e.name_zh)) {
    console.log('SKIP duplicate name:', e.name_zh, e.id);
    return;
  }
  seenNames.add(e.name_zh);
  keep.push(e);
});

console.log('Base 30 + extended =', keep.length, 'total');

const arakawa = keep.filter(d => d.ward === '荒川区');
console.log('Arakawa count:', arakawa.length);
arakawa.forEach(d => console.log(' -', d.id, d.name_zh));

fs.writeFileSync('./src/data/seed.json', JSON.stringify(keep, null, 2));
