using Newtonsoft.Json;

namespace Updater
{
    public class UpdateData
    {
        [JsonProperty("version")]
        public string Version { get; set; }
    }
}
