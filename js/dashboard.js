// 仪表盘页面（接单大厅）- dashboard.js

// 全局变量
let mapInstance = null;
let userMarker = null;
let userCircle = null;

// 模拟数据
const expressPoints = [
    { id: 1, name: '菜鸟驿站-东门', location: [117.2345, 31.8625], type: 'cainiao', orders: 5 },
    { id: 2, name: '顺丰快递点', location: [117.2375, 31.8645], type: 'sf', orders: 3 },
    { id: 3, name: '圆通快递点', location: [117.2385, 31.8615], type: 'yuantong', orders: 4 },
    { id: 4, name: '中通快递点', location: [117.2335, 31.8655], type: 'zhongtong', orders: 2 },
    { id: 5, name: '韵达快递点', location: [117.2395, 31.8635], type: 'yunda', orders: 6 },
    { id: 6, name: '申通快递点', location: [117.2325, 31.8665], type: 'shentong', orders: 1 },
    { id: 7, name: 'EMS快递点', location: [117.2405, 31.8605], type: 'ems', orders: 3 },
    { id: 8, name: '京东自提点', location: [117.2315, 31.8645], type: 'jd', orders: 4 }
];

const availableOrders = [
    { id: 'ORD001', expressNo: 'SF1234567890', from: '菜鸟驿站-东门', to: '图书馆', reward: 3, status: 'available' },
    { id: 'ORD002', expressNo: 'YT9876543210', from: '圆通快递点', to: '教学楼A', reward: 2.5, status: 'available' },
    { id: 'ORD003', expressNo: 'ZT1122334455', from: '中通快递点', to: '宿舍楼1栋', reward: 4, status: 'available' },
    { id: 'ORD004', expressNo: 'YD5566778899', from: '韵达快递点', to: '体育馆', reward: 3.5, status: 'available' },
    { id: 'ORD005', expressNo: 'JD9988776655', from: '京东自提点', to: '食堂', reward: 2, status: 'available' }
];

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    initMap();
    loadOrderList();
});

// ==================== 地图功能 ====================

// 初始化地图
function initMap() {
    const mapContainer = document.getElementById('mapContainer');
    if (!mapContainer) {
        console.warn('地图容器不存在');
        return;
    }
    
    console.log('=== 开始初始化地图 ===');
    
    try {
        mapInstance = new AMap.Map('mapContainer', {
            zoom: 16,
            center: [117.2365, 31.8635],
            resizeEnable: true,
            mapStyle: 'amap://styles/normal'
        });
        
        mapInstance.on('complete', function() {
            console.log('地图加载完成，开始获取用户位置');
            initMapControls();
            addManualSearchBox();
            getUserLocation();
        });
        
        mapInstance.on('error', function(e) {
            console.error('地图加载错误:', e);
            showToast('地图加载失败，请刷新页面重试', 'error');
            loadExpressPoints();
            loadOrdersOnMap();
        });
        
        setTimeout(function() {
            if (!mapInstance || !mapInstance.getCenter()) {
                console.warn('地图初始化超时，尝试重新初始化');
                initMapFallback();
            }
        }, 10000);
        
    } catch (error) {
        console.error('地图初始化异常:', error);
        initMapFallback();
    }
}

// 初始化地图控件
function initMapControls() {
    if (!mapInstance) return;
    
    AMap.plugin(['AMap.Scale', 'AMap.ToolBar', 'AMap.MapType'], function() {
        try {
            mapInstance.addControl(new AMap.Scale());
            mapInstance.addControl(new AMap.ToolBar());
            mapInstance.addControl(new AMap.MapType());
        } catch (e) {
            console.warn('添加控件失败:', e);
        }
    });
}

// 地图初始化失败时的降级方案
function initMapFallback() {
    showToast('地图服务暂时不可用，将显示静态位置', 'warning');
    loadExpressPoints();
    loadOrdersOnMap();
}

// 添加手动搜索定位框
function addManualSearchBox() {
    // 检查搜索框是否已存在
    if (document.getElementById('locationSearchBox')) {
        return;
    }
    
    const searchDiv = document.createElement('div');
    searchDiv.id = 'locationSearchBox';
    searchDiv.style.cssText = `
        position: absolute;
        top: 10px;
        left: 10px;
        z-index: 100;
        background: white;
        padding: 10px;
        border-radius: 10px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    `;
    
    const input = document.createElement('input');
    input.type = 'text';
    input.id = 'locationInput';
    input.placeholder = '搜索位置...';
    input.style.cssText = `
        width: 220px;
        padding: 8px 12px;
        border: 1px solid #ddd;
        border-radius: 6px;
        outline: none;
    `;
    
    // 回车键触发搜索
    input.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchAndLocate();
        }
    });
    
    const button = document.createElement('button');
    button.textContent = '搜索';
    button.addEventListener('click', searchAndLocate);
    button.style.cssText = `
        margin-left: 8px;
        padding: 8px 16px;
        background: #0d6efd;
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
    `;
    
    searchDiv.appendChild(input);
    searchDiv.appendChild(button);
    
    // 使用 appendChild 而不是 innerHTML，避免覆盖地图
    document.getElementById('mapContainer').appendChild(searchDiv);
}

// 搜索并定位
function searchAndLocate() {
    console.log('搜索函数被调用');
    
    const input = document.getElementById('locationInput');
    if (!input) {
        console.error('搜索输入框不存在');
        showToast('搜索框未初始化', 'danger');
        return;
    }
    
    const keyword = input.value.trim();
    console.log('搜索关键词:', keyword);
    
    if (!keyword) {
        showToast('请输入搜索关键词', 'warning');
        return;
    }
    
    if (!AMap) {
        console.error('高德地图API未加载');
        showToast('地图服务未加载，请刷新页面', 'danger');
        return;
    }
    
    if (!mapInstance) {
        console.error('地图实例不存在');
        showToast('地图未初始化，请刷新页面', 'danger');
        return;
    }
    
    AMap.plugin('AMap.Geocoder', function() {
        console.log('Geocoder插件加载成功');
        
        const geocoder = new AMap.Geocoder({
            city: '全国',
            timeout: 10000
        });
        
        // 设置超时处理
        const timeout = setTimeout(function() {
            console.error('地理编码请求超时，尝试IP定位');
            showToast('搜索超时，尝试定位到您所在城市', 'info');
            fallbackToCitySearch(keyword);
        }, 10000);
        
        geocoder.getLocation(keyword, function(status, result) {
            clearTimeout(timeout);
            console.log('地理编码结果:', status, result);
            
            if (status === 'complete') {
                if (result.geocodes && result.geocodes.length > 0) {
                    const location = result.geocodes[0].location;
                    mapInstance.setCenter(location);
                    mapInstance.setZoom(17);
                    
                    addDraggableMarker(location, result.geocodes[0].formattedAddress);
                    showToast(`已定位到: ${result.geocodes[0].formattedAddress}`, 'success');
                } else {
                    console.error('地理编码返回空结果，尝试城市搜索');
                    showToast('未找到精确位置，尝试定位到城市', 'info');
                    fallbackToCitySearch(keyword);
                }
            } else {
                console.error('地理编码失败，尝试城市搜索:', result);
                showToast('搜索失败，尝试定位到城市', 'info');
                fallbackToCitySearch(keyword);
            }
        });
    });
}

// 降级方案：城市搜索
function fallbackToCitySearch(keyword) {
    AMap.plugin('AMap.Geocoder', function() {
        const geocoder = new AMap.Geocoder({
            city: '全国'
        });
        
        geocoder.getLocation(keyword, function(status, result) {
            console.log('城市搜索结果:', status, result);
            
            if (status === 'complete' && result.geocodes && result.geocodes.length > 0) {
                const location = result.geocodes[0].location;
                mapInstance.setCenter(location);
                mapInstance.setZoom(12);
                
                addDraggableMarker(location, keyword);
                showToast(`已定位到: ${keyword}`, 'success');
            } else {
                // 降级到IP定位
                console.error('城市搜索也失败，使用IP定位');
                fallbackToIPLocation();
            }
        });
    });
}

// 添加可拖拽的位置标记
function addDraggableMarker(lnglat, title) {
    // 移除之前的用户标记和精度圆
    if (userMarker) {
        mapInstance.remove(userMarker);
    }
    if (userCircle) {
        mapInstance.remove(userCircle);
    }
    
    // 创建可拖拽标记
    userMarker = new AMap.Marker({
        position: lnglat,
        map: mapInstance,
        draggable: true,
        cursor: 'move',
        icon: new AMap.Icon({
            image: 'https://webapi.amap.com/theme/v1.3/markers/n/mark_b.png',
            size: new AMap.Size(32, 32)
        }),
        title: title || '我的位置',
        offset: new AMap.Pixel(-16, -16)
    });
    
    // 添加拖拽结束事件
    userMarker.on('dragend', function(e) {
        const newPosition = e.lnglat;
        
        // 更新精度圆位置
        if (userCircle) {
            userCircle.setCenter(newPosition);
        }
        
        // 逆地理编码获取地址
        AMap.plugin('AMap.Geocoder', function() {
            const geocoder = new AMap.Geocoder();
            geocoder.getAddress(newPosition, function(status, result) {
                if (status === 'complete') {
                    const address = result.regeocode.formattedAddress;
                    userMarker.setTitle(address);
                    showToast(`位置已更新: ${address}`, 'success');
                }
            });
        });
    });
    
    // 添加精度指示圆
    userCircle = new AMap.Circle({
        center: lnglat,
        radius: 20,
        strokeColor: '#10b981',
        strokeOpacity: 0.5,
        strokeWeight: 1,
        fillColor: '#10b981',
        fillOpacity: 0.1,
        map: mapInstance
    });
}

// 获取用户位置
function getUserLocation() {
    if (!navigator.geolocation) {
        showToast('您的浏览器不支持定位功能', 'warning');
        loadExpressPoints();
        loadOrdersOnMap();
        return;
    }
    
    const isHTTPS = location.protocol === 'https:' || location.hostname === 'localhost';
    
    if (!isHTTPS) {
        showToast('当前网站未使用HTTPS，可能无法获取高精度位置', 'info');
    }
    
    AMap.plugin('AMap.Geolocation', function() {
        const geolocation = new AMap.Geolocation({
            enableHighAccuracy: isHTTPS,
            timeout: isHTTPS ? 30000 : 10000,
            maximumAge: 0,
            convert: true,
            showButton: true,
            buttonPosition: 'RB',
            buttonOffset: new AMap.Pixel(10, 10),
            showMarker: true,
            showCircle: true,
            panToLocation: true,
            zoomToAccuracy: true
        });
        
        mapInstance.addControl(geolocation);
        
        let watcher = null;
        let bestAccuracy = Infinity;
        let initialPositionSet = false;
        let timeoutTimer = null;
        
        const handlePosition = function(status, result) {
            console.log('定位更新:', status, result);
            
            if (status === 'complete' && result && result.position) {
                const accuracy = result.accuracy || 0;
                console.log(`定位更新: 精度 ${accuracy} 米`);
                
                if (accuracy < bestAccuracy) {
                    bestAccuracy = accuracy;
                    
                    if (!initialPositionSet) {
                        handleLocationSuccess(result);
                        initialPositionSet = true;
                        loadExpressPoints();
                        loadOrdersOnMap();
                    } else if (accuracy < 50) {
                        handleLocationSuccess(result);
                        
                        if (watcher) {
                            geolocation.clearWatch(watcher);
                            watcher = null;
                            console.log('达到高精度要求，停止连续定位');
                        }
                    } else if (accuracy < 100) {
                        handleLocationSuccess(result);
                    }
                }
            } else if (status !== 'complete') {
                if (watcher) {
                    geolocation.clearWatch(watcher);
                    watcher = null;
                }
                console.error('定位失败:', result);
                if (!initialPositionSet) {
                    handleLocationError(result);
                    loadExpressPoints();
                    loadOrdersOnMap();
                }
            }
        };
        
        if (isHTTPS) {
            watcher = geolocation.watchPosition(handlePosition);
            
            timeoutTimer = setTimeout(function() {
                if (watcher) {
                    geolocation.clearWatch(watcher);
                    watcher = null;
                    console.log('连续定位超时，停止监听');
                    if (!initialPositionSet) {
                        showToast('定位超时，使用当前位置', 'warning');
                    }
                }
            }, 30000);
        } else {
            geolocation.getCurrentPosition(function(status, result) {
                handlePosition(status, result);
                if (!initialPositionSet) {
                    loadExpressPoints();
                    loadOrdersOnMap();
                }
            });
        }
    });
}

// 使用默认位置
function fallbackToDefaultLocation() {
    const defaultLocation = [117.2365, 31.8635];
    mapInstance.setCenter(defaultLocation);
    addDraggableMarker(defaultLocation, '当前位置');
    showToast('无法获取当前位置，已定位到默认位置', 'info');
}

// 定位成功处理
function handleLocationSuccess(result) {
    const lnglat = result.position;
    const accuracy = result.accuracy || 0;
    
    addDraggableMarker(lnglat, '我的位置');
    
    let accuracyText = '';
    if (accuracy > 0) {
        if (accuracy < 50) {
            accuracyText = `（精度：约${Math.round(accuracy)}米，高精度）`;
        } else if (accuracy < 200) {
            accuracyText = `（精度：约${Math.round(accuracy)}米）`;
        } else {
            accuracyText = `（精度：约${Math.round(accuracy)}米，建议移动到开阔区域）`;
        }
    }
    
    showToast(`定位成功${accuracyText}，可拖拽标记调整位置`, 'success');
}

// 定位失败处理
function handleLocationError(result) {
    // 检查 result 是否有效
    if (!result || typeof result !== 'object') {
        console.error('定位失败: 无效的返回结果');
        showToast('定位失败，使用默认位置', 'warning');
        fallbackToIPLocation();
        return;
    }
    
    const errorCode = result.errorCode;
    console.error('定位失败:', result);
    
    let message = '定位失败，使用默认位置';
    
    // 检查 errorCode 是否存在
    if (errorCode !== undefined && errorCode !== null) {
        switch(errorCode) {
            case 1:
                message = '用户拒绝了定位权限，请在浏览器设置中允许';
                break;
            case 2:
                message = '无法获取位置信息，请检查设备定位服务是否开启';
                break;
            case 3:
                message = '定位超时，请检查网络连接';
                break;
            case 4:
                message = '当前网站未部署在HTTPS环境，无法获取高精度位置';
                break;
            default:
                message = `定位失败 (错误码: ${errorCode})，使用默认位置`;
        }
    } else {
        // errorCode 不存在，尝试获取其他错误信息
        const errorInfo = result.info || result.message || '未知错误';
        message = `定位失败: ${errorInfo}`;
    }
    
    showToast(message, 'warning');
    fallbackToIPLocation();
}

// 降级方案：IP定位
function fallbackToIPLocation() {
    try {
        AMap.plugin('AMap.CitySearch', function() {
            const citySearch = new AMap.CitySearch();
            citySearch.getLocalCity(function(status, result) {
                if (status === 'complete' && result.city) {
                    const cityCenter = result.bounds.getCenter();
                    mapInstance.setCenter(cityCenter);
                    showToast(`已定位到: ${result.city}`, 'info');
                }
            });
        });
    } catch (e) {
        console.error('IP定位也失败:', e);
    }
}

// 加载快递点标记
function loadExpressPoints() {
    if (!mapInstance) return;
    
    expressPoints.forEach(point => {
        const marker = new AMap.Marker({
            position: point.location,
            map: mapInstance,
            icon: getExpressIcon(point.type),
            title: point.name,
            offset: new AMap.Pixel(-12, -12)
        });
        
        marker.on('click', function() {
            showExpressInfoWindow(point);
        });
    });
}

// 获取快递公司图标
function getExpressIcon(type) {
    const icons = {
        cainiao: 'https://webapi.amap.com/theme/v1.3/markers/n/mark_green.png',
        sf: 'https://webapi.amap.com/theme/v1.3/markers/n/mark_red.png',
        yuantong: 'https://webapi.amap.com/theme/v1.3/markers/n/mark_yellow.png',
        zhongtong: 'https://webapi.amap.com/theme/v1.3/markers/n/mark_orange.png',
        yunda: 'https://webapi.amap.com/theme/v1.3/markers/n/mark_blue.png',
        shentong: 'https://webapi.amap.com/theme/v1.3/markers/n/mark_purple.png',
        ems: 'https://webapi.amap.com/theme/v1.3/markers/n/mark_cyan.png',
        jd: 'https://webapi.amap.com/theme/v1.3/markers/n/mark_darkblue.png'
    };
    
    return new AMap.Icon({
        image: icons[type] || icons.cainiao,
        size: new AMap.Size(24, 24)
    });
}

// 显示快递点信息窗口
function showExpressInfoWindow(point) {
    const infoWindow = new AMap.InfoWindow({
        content: `
            <div style="padding: 10px;">
                <h4>${point.name}</h4>
                <p>待取包裹: ${point.orders} 件</p>
                <button onclick="viewOrdersAtPoint('${point.name}')" style="margin-top: 10px; padding: 5px 15px; background: #0d6efd; color: white; border: none; border-radius: 5px; cursor: pointer;">查看订单</button>
            </div>
        `,
        size: new AMap.Size(200, 120)
    });
    
    infoWindow.open(mapInstance, point.location);
}

// 加载订单标记
function loadOrdersOnMap() {
    if (!mapInstance) return;
    
    availableOrders.forEach(order => {
        const point = expressPoints.find(p => p.name === order.from);
        if (point) {
            const marker = new AMap.Marker({
                position: point.location,
                map: mapInstance,
                icon: new AMap.Icon({
                    image: 'https://webapi.amap.com/theme/v1.3/markers/n/mark_pink.png',
                    size: new AMap.Size(20, 20)
                }),
                title: `${order.from} - ${order.to}`,
                offset: new AMap.Pixel(-10, -10)
            });
            
            marker.on('click', function() {
                showOrderInfoWindow(order, point.location);
            });
        }
    });
}

// 显示订单信息窗口
function showOrderInfoWindow(order, position) {
    const infoWindow = new AMap.InfoWindow({
        content: `
            <div style="padding: 15px;">
                <h4>订单详情</h4>
                <p><strong>单号:</strong> ${order.expressNo}</p>
                <p><strong>取件点:</strong> ${order.from}</p>
                <p><strong>送达点:</strong> ${order.to}</p>
                <p><strong>奖励:</strong> ¥${order.reward}</p>
                <button onclick="acceptOrder('${order.id}')" style="margin-top: 15px; padding: 8px 20px; background: #28a745; color: white; border: none; border-radius: 5px; cursor: pointer; width: 100%;">接单</button>
            </div>
        `,
        size: new AMap.Size(250, 180)
    });
    
    infoWindow.open(mapInstance, position);
}

// 接单
function acceptOrder(orderId) {
    const order = availableOrders.find(o => o.id === orderId);
    if (order) {
        order.status = 'accepted';
        showToast(`成功接单！订单号: ${order.expressNo}`, 'success');
        loadOrderList();
        loadOrdersOnMap();
    }
}

// 查看快递点订单
function viewOrdersAtPoint(pointName) {
    const orders = availableOrders.filter(o => o.from === pointName);
    if (orders.length > 0) {
        showToast(`该点有 ${orders.length} 个订单`, 'info');
    } else {
        showToast('该点暂无订单', 'info');
    }
}

// 刷新地图
function refreshMap() {
    if (mapInstance) {
        mapInstance.destroy();
        mapInstance = null;
        userMarker = null;
        userCircle = null;
    }
    
    const mapContainer = document.getElementById('mapContainer');
    if (mapContainer) {
        mapContainer.innerHTML = '<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: #666;">正在重新定位...</div>';
    }
    
    setTimeout(function() {
        initMap();
    }, 500);
}

// ==================== 订单列表功能 ====================

// 加载订单列表
function loadOrderList() {
    const orderList = document.getElementById('orderList');
    if (!orderList) return;
    
    const available = availableOrders.filter(o => o.status === 'available');
    
    if (available.length === 0) {
        orderList.innerHTML = '<p class="text-center text-muted py-4">暂无可用订单</p>';
        return;
    }
    
    orderList.innerHTML = available.map(order => `
        <div class="card mb-3">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <h5 class="card-title">订单 ${order.id}</h5>
                        <p class="card-text">快递单号: ${order.expressNo}</p>
                        <p class="card-text">取件点: ${order.from}</p>
                        <p class="card-text">送达点: ${order.to}</p>
                    </div>
                    <div class="text-right">
                        <span class="badge bg-success">¥${order.reward}</span>
                        <button onclick="acceptOrder('${order.id}')" class="btn btn-primary mt-2">接单</button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// ==================== 通用功能 ====================

// 显示提示消息
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${type} border-0`;
    toast.style.position = 'fixed';
    toast.style.top = '20px';
    toast.style.right = '20px';
    toast.style.zIndex = '9999';
    toast.style.padding = '12px 20px';
    toast.style.borderRadius = '8px';
    toast.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
    
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">${message}</div>
        </div>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s';
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}