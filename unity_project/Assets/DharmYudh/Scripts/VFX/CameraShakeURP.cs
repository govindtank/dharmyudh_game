using UnityEngine;

namespace DharmYudh.VFX
{
    public class CameraShakeURP : MonoBehaviour
    {
        public static CameraShakeURP Instance { get; private set; }

        private float shakeIntensity = 0f;
        private float shakeDecay = 0.88f;
        private Vector3 initialPosition;

        private void Awake()
        {
            if (Instance == null) Instance = this;
            else Destroy(gameObject);
        }

        private void Start()
        {
            initialPosition = transform.localPosition;
        }

        private void Update()
        {
            if (shakeIntensity > 0.01f)
            {
                Vector3 randomOffset = Random.insideUnitSphere * shakeIntensity;
                randomOffset.z = 0;
                transform.localPosition = initialPosition + randomOffset;

                shakeIntensity *= Mathf.Pow(shakeDecay, Time.deltaTime * 60f);
            }
            else
            {
                shakeIntensity = 0f;
                transform.localPosition = initialPosition;
            }
        }

        public void TriggerShake(float intensity = 5f)
        {
            shakeIntensity = Mathf.Max(shakeIntensity, intensity);
        }
    }
}
