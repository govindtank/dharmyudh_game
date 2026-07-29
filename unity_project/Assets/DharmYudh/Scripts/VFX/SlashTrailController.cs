using UnityEngine;

namespace DharmYudh.VFX
{
    public class SlashTrailController : MonoBehaviour
    {
        public TrailRenderer trailRenderer;

        private void Awake()
        {
            if (trailRenderer == null) trailRenderer = GetComponent<TrailRenderer>();
            if (trailRenderer != null) trailRenderer.emitting = false;
        }

        public void EmitTrail(Color glowColor, float duration = 0.3f)
        {
            if (trailRenderer == null) return;

            trailRenderer.startColor = glowColor;
            trailRenderer.endColor = new Color(glowColor.r, glowColor.g, glowColor.b, 0f);
            trailRenderer.emitting = true;

            CancelInvoke(nameof(StopEmitting));
            Invoke(nameof(StopEmitting), duration);
        }

        public void StopEmitting()
        {
            if (trailRenderer != null)
            {
                trailRenderer.emitting = false;
            }
        }
    }
}
