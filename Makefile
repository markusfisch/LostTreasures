BUILD = index.html
ARCHIVE = archive.zip

$(ARCHIVE): $(BUILD)
	zip $@ $^

$(BUILD): src.js vs.glsl fs.glsl
	bash index.html.sh > $(BUILD)

clean:
	rm -f $(ARCHIVE) $(BUILD)

live: $(BUILD)
	scp $(BUILD) hhsw.de@ssh.strato.de:sites/proto/js13k2017/
