import { OBJLoader } from './OBJLoader.js'
import { MTLLoader } from './MTLLoader.js'
import { OrbitControls } from './OrbitControls.js'
import Stats from './stats.module.js'

const JMC2OBJ_FOLDER = 'minecraft-obj-folder_lateral(-11,-2,-1,9)_height(30,150)_offset=center'
// const JMC2OBJ_FOLDER = 'minecraft-obj-folder_lateral(-11,-2,-1,9)_height(30,150)_offset=center_texturescale=5'
// const JMC2OBJ_FOLDER = 'minecraft-obj-folder_lateral(-11,-2,-1,9)_height(30,150)_offset=center_texturescale=2'

const scene = new THREE.Scene();
scene.add(new THREE.AxesHelper(5))

const light = new THREE.PointLight()
light.position.set(50, 100, 50)
scene.add(light)

const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
camera.position.z = 3

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true


// instantiate a loader
const loader = new OBJLoader();
const materials_loader = new MTLLoader()
materials_loader.load(
  `${JMC2OBJ_FOLDER}/minecraft.mtl`,
  (materials_creator) => {
    loader.setMaterials(materials_creator)
    loader.load(
      `${JMC2OBJ_FOLDER}/minecraft.obj`,
      (object) => {
        scene.add(object)
        console.log('loaded')
      },
      (xhr) => {
        console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
      },
      (error) => {
        console.error('an error')
        console.error(error)
      }
    )
  }
)

// // load a resource
// loader.load(
// 	// resource URL
// 	// 'minecraft-obj-folder_lateral(-11,-2,-1,9)_height(30,150)/minecraft.obj',
// 	`${JMC2OBJ_FOLDER}/minecraft.obj`,
// 	// called when resource is loaded
// 	function ( object ) {
//     console.log('loaded baby!')

// 		scene.add( object );

// 	},
// 	// called when loading is in progresses
// 	function ( xhr ) {

// 		console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );

// 	},
// 	// called when loading has errors
// 	function ( error ) {

// 		console.log( 'An error happened' );

// 	}
// );

const stats = Stats()
document.body.appendChild(stats.dom)


// const geometry = new THREE.BoxGeometry();
// const material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
// const cube = new THREE.Mesh( geometry, material );
// scene.add( cube );

// camera.position.z = 5;

// const light = new THREE.PointLight( 0xff0000, 1, 100 );
// light.position.set( 50, 50, 50 );
// scene.add( light );


function animate() {
    requestAnimationFrame(animate)

    controls.update()

    render()

    stats.update()
}

function render() {
    renderer.render(scene, camera)
}

animate()
