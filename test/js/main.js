window.addEventListener('DOMContentLoaded', init);
function init() {
    // text
    let globalFont = null;
    let globalText = null;

    // ポリフィルを使用
    const polyfill = new WebVRPolyfill();
    // サイズを指定
    const width = 960;
    const height = 540;
    // レンダラーを作成
    const renderer = new THREE.WebGLRenderer({
        canvas: document.querySelector('#myCanvas'),
        antialias:true
    });
    renderer.setSize(width, height);
    
    // レンダラーのWebVR設定を有効にする
    renderer.vr.enabled = true;
    const container = document.getElementById('container');
    container.style.position = "relative";
    container.style.width = width;
    container.style.height = height;
    // WebVRの開始ボタンをDOMに追加
    container.appendChild(WEBVR.createButton(renderer));
    // シーンを作成
    const scene = new THREE.Scene();
    // カメラを作成
    const camera = new THREE.PerspectiveCamera(90, width / height);
    // カメラ用コンテナを作成
    const cameraContainer = new THREE.Object3D();
    cameraContainer.add(camera);
    scene.add(cameraContainer);
    cameraContainer.position.y = 100;
    cameraContainer.position.z = -100;
    // 光源を作成
    {
        const spotLight = new THREE.SpotLight(0xFFFFFF, 4, 2000, Math.PI / 5, 0.2, 1.5);
        spotLight.position.set(500, 300, 500);
        scene.add(spotLight);
        const ambientLight = new THREE.AmbientLight(0x333333);
        scene.add(ambientLight);
    }
    // 地面を作成
    {
        // 床のテクスチャー
        const texture = new THREE.TextureLoader().load('imgs/floor.png');
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping; // リピート可能に
        texture.repeat.set(10, 10); // 10x10マスに設定
        texture.magFilter = THREE.NearestFilter;
        const floor = new THREE.Mesh(
            new THREE.PlaneGeometry(1000, 1000),
            new THREE.MeshStandardMaterial({map: texture, roughness: 0.0, metalness: 0.6}),
        );
        floor.rotation.x = -Math.PI / 2;
        scene.add(floor);
    }
    const boxList = [];
    // 立方体を作成
    // {
    //     // 立方体のジオメトリを作成
    //     const geometry = new THREE.BoxGeometry(45, 45, 45);
    //     // 立方体を複数作成しランダムに配置
    //     const num = 60;
    //     loop: for (let i = 0; i < num; i++) {
    //         const px = Math.round((Math.random() - 0.5) * 19) * 50 + 25;
    //         const pz = Math.round((Math.random() - 0.5) * 19) * 50 + 25;
    //         for (let j = 0; j < i; j++) {
    //             const box2 = boxList[j];
    //             if(box2.position.x === px && box2.position.z === pz){
    //                 i -= 1;
    //                 continue loop;
    //             }
    //         }
    //         // 立方体のマテリアルを作成
    //         const material = new THREE.MeshStandardMaterial({color: 0x1000000 * Math.random(), roughness: 0.1, metalness: 0.5});
    //         const box = new THREE.Mesh(geometry, material);
    //         box.position.x = px;
    //         box.position.y = 25;
    //         box.position.z = pz;
    //         scene.add(box);
    //         boxList.push(box);
    //     }
    // }

    //文字を追加
    {
        // FontLoaderインスタンスの作成
        const loader = new THREE.FontLoader();
        // フォントのロード
        loader.load( 'fonts/optimer_regular.typeface.json', function ( font ) {
            globalFont = font;
            // ここにフォントを読み込んだあとの処理を記述
        } );
    }
    // レンダラーにループ関数を登録
    renderer.setAnimationLoop(tick);
    
    // コントローラー取得用
    let contoroller = null;

    let time = 0;

    // 立方体のジオメトリを作成
    const geometry = new THREE.BoxGeometry(45, 45, 45);
    // 立方体のマテリアルを作成
    const material = new THREE.MeshStandardMaterial({color: 0x1ffffff * Math.random(), roughness: 0.1, metalness: 0.5});
    let box = new THREE.Mesh(geometry, material);
    box.position.x = 0;
    box.position.y = 100;
    box.position.z = -300;
    scene.add(box);
    
    // 毎フレーム時に実行されるループイベント
    function tick() {
        time += 1;
        contoroller = navigator.getGamepads()[0];
        if (contoroller) {
            const pose = contoroller.pose;
            if(pose.position !== null) box.position.fromArray.fromArray(pose.position);
            if (pose.orientation !== null) box.quaternion.fromArray(pose.orientation);
        }
        // デバイスからの情報を元に姿勢を更新し、ルームスケールのマトリクスを掛けて最終的な姿勢にする
        box.matrix.compose(box.position, box.quaternion, box.scale);
        box.matrix.multiplyMatrices(box.standingMatrix, box.matrix);
        box.matrixWorldNeedsUpdate = true;
        box.visible = true;

        if(contoroller.buttons[0].pressed) {
            box.position.x = -1;
        }
        if(contoroller.buttons[1].pressed) {
            box.position.y = -1;
        }
        if(contoroller.buttons[2].pressed) {
            box.position.x = 1;
        }
        if(contoroller.buttons[3].pressed) {
            box.position.y = 1;
        }

        // if(globalFont && time % 20 === 0) {
        //     scene.remove(globalText);
        //     setText(String(contoroller),globalFont);
        // }
        // 立方体を動かす
        // const length = boxList.length;
        // for (let i = 0; i < length; i++) {
        //     boxList[i].position.y = 125 + 100 * Math.cos(time * 0.0005 * i + i / 10);
        // }
        
        // レンダリング
        renderer.render(scene, camera);
    }

    function setText(text, font) {

        let textGeometry = new THREE.TextGeometry( text, {
            font: font,
            size: 50.0,
            height: 30,
            curveSegments: 10,
            bevelThickness: 3,
            bevelSize: 1.0,
            bevelEnabled: true
        } );

        textGeometry.center();
        const material = new THREE.MeshBasicMaterial( { color: 0xffffff } );
        globalText = new THREE.Mesh( textGeometry, material );
        globalText.position.x = 100;
        globalText.position.y = 100;
        globalText.position.z = -300;
        scene.add(globalText);
    }
}